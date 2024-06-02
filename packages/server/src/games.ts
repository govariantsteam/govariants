import {
  GameResponse,
  makeGameObject,
  MovesType,
  User,
  getOnlyMove,
  HasTimeControlConfig,
  GamesFilter,
  AbstractGame,
} from "@ogfcommunity/variants-shared";
import { ObjectId, WithId, Document, Filter } from "mongodb";
import { getDb } from "./db";
import { io } from "./socket_io";
import { getTimeoutService } from "./index";
import {
  GetInitialTimeControl,
  ValidateTimeControlConfig,
} from "./time-control/time-control";
import { timeControlHandlerMap } from "./time-control/time-handler-map";
import { Clock } from "./time-control/clock";
import { GameStateResponse } from "../../shared/src/api_types";

export function gamesCollection() {
  return getDb().db().collection("games");
}

/**
 * @param count number of games to return (default = 10, max = 100)
 * @param offset number of games to skip (default = 0)
 * @param filter filter settings for the query
 */
export async function getGames(
  count: number,
  offset: number,
  filter?: GamesFilter,
): Promise<GameResponse[]> {
  const dbFilter: Filter<Document> = {};
  if (filter && filter.user_id) {
    dbFilter["players.id"] = filter.user_id;
  }
  if (filter && filter.variant) {
    dbFilter["variant"] = filter.variant;
  }

  const games = gamesCollection()
    .find(dbFilter)
    .sort({ _id: -1 })
    .skip(offset || 0)
    .limit(Math.min(count || 10, 100))
    .toArray();
  return (await games).map(outwardFacingGame);
}

export async function getGamesWithTimeControl(): Promise<GameResponse[]> {
  const games = gamesCollection()
    .find({ time_control: { $ne: null } })
    .toArray();
  return (await games).map(outwardFacingGame);
}

export async function getGame(id: string): Promise<GameResponse> {
  const db_game = await gamesCollection().findOne({
    _id: new ObjectId(id),
  });

  if (!db_game) {
    throw new Error("Game not found");
  }

  const game = outwardFacingGame(db_game);
  // Legacy games don't have a players field
  // TODO: remove this code after doing proper db migration
  if (!game.players) {
    game.players = await BACKFILL_addEmptyPlayersArray(game);
  }
  const playerClocks = Object.values(game.time_control?.forPlayer ?? {});
  // bpj 2024-04-04: changed playerClock.remainingTimeMS to playerClock.clockState
  // in order to support more complex clock states such as byo-yomi
  if (game.time_control && playerClocks.some((tc) => tc.clockState == null)) {
    playerClocks.forEach((tc) => {
      if (tc.clockState) return;

      if ("remainingTimeMS" in tc) {
        // This is the state for Fischer and Absolute, the only supported
        // time controls at the time of this change.
        tc.clockState = { remainingTimeMS: tc.remainingTimeMS };
      }
    });
  }

  return game;
}

export async function createGame(
  variant: string,
  config: object,
): Promise<GameResponse> {
  // Construct a game from the config to ensure the config is valid
  makeGameObject(variant, config);

  const game = {
    variant: variant,
    moves: [] as MovesType[],
    config: config,
    time_control: GetInitialTimeControl(variant, config),
  };

  const result = await gamesCollection().insertOne(game);

  if (!result) {
    throw new Error("Failed to create game.");
  }

  return {
    id: result.insertedId.toString(),
    ...game,
  };
}

export async function playMove(
  game_id: string,
  moves: MovesType,
  user_id: string,
): Promise<GameResponse> {
  const game = await getGame(game_id);

  const { player: playerNr, move: _new_move } = getOnlyMove(moves);

  if (!game.players || game.players[playerNr] == null) {
    throw Error(`Seat ${playerNr} not occupied!`);
  }

  const expected_player = game.players[playerNr];

  if (expected_player.id !== user_id) {
    throw Error(
      `Not the right user: expected ${expected_player.id}, got ${user_id}`,
    );
  }

  return await handleMoveAndTime(game_id, moves, game);
}

export async function handleMoveAndTime(
  game_id: string,
  moves: MovesType,
  game: GameResponse,
): Promise<GameResponse> {
  // Verify that moves are legal
  const game_obj = makeGameObject(game.variant, game.config);
  game.moves.forEach((moves) => {
    const { player, move } = getOnlyMove(moves);
    game_obj.playMove(player, move);
  });

  if (game_obj.result !== "") {
    throw Error("Game is already finished.");
  }

  const { player: playerNr, move: new_move } = getOnlyMove(moves);

  const previousRound = game_obj.round;
  game_obj.playMove(playerNr, new_move);
  const isRoundTransition = previousRound !== game_obj.round;

  let timeControl = game.time_control;
  if (
    HasTimeControlConfig(game.config) &&
    ValidateTimeControlConfig(game.config.time_control)
  ) {
    if (game_obj.phase === "gameover") {
      getTimeoutService().clearGameTimeouts(game.id);
    }
    if (Object.keys(timeControlHandlerMap).includes(game.variant)) {
      const timeHandler = new timeControlHandlerMap[game.variant](
        new Clock(),
        getTimeoutService(),
      );
      timeControl = timeHandler.handleMove(
        game,
        game_obj,
        playerNr,
        new_move,
        isRoundTransition,
      );
    }
  }

  gamesCollection()
    .updateOne(
      { _id: new ObjectId(game_id) },
      { $push: { moves: moves }, $set: { time_control: timeControl } },
    )
    .catch(console.log);

  game.moves.push(moves);

  emitGame(game.id, game.players?.length ?? 0, game_obj);

  return game;
}

function emitGame(
  game_id: string,
  num_players: number,
  game_obj: AbstractGame<unknown, unknown>,
): void {
  const next_to_play = game_obj.nextToPlay();
  const specialMoves = game_obj.specialMoves();

  io()
    .to(`game/${game_id}`)
    .emit("move", {
      state: game_obj.exportState(null),
      round: game_obj.round,
      next_to_play: next_to_play,
      special_moves: specialMoves,
      result: game_obj.result,
      seat: null,
    });

  for (let seat = 0; seat < num_players; seat++) {
    const gameStateResponse: GameStateResponse = {
      state: game_obj.exportState(seat),
      round: game_obj.round,
      next_to_play: next_to_play,
      special_moves: specialMoves,
      result: game_obj.result,
      seat: seat,
    };
    io().to(`game/${game_id}/${seat}`).emit("move", gameStateResponse);
  }
}

async function updateSeat(
  game_id: string,
  seat: number,
  user_id: string,
  new_user: User | undefined,
) {
  const game = await getGame(game_id);

  // Legacy games don't have a players field
  // TODO: remove this code after doing proper db migration
  if (!game.players) {
    game.players = await BACKFILL_addEmptyPlayersArray(game);
  }

  // If the seat is occupied by another player, throw an error.
  if (game.players[seat] != null && game.players[seat].id != user_id) {
    throw new Error("Seat taken!");
  }

  game.players[seat] = new_user;

  await gamesCollection().updateOne(
    { _id: new ObjectId(game_id) },
    { $set: { [`players.${seat}`]: new_user } },
  );

  return game.players;
}

export function takeSeat(game_id: string, seat: number, user: User) {
  return updateSeat(game_id, seat, user.id, user);
}

export async function leaveSeat(
  game_id: string,
  seat: number,
  user_id: string,
) {
  return updateSeat(game_id, seat, user_id, undefined);
}

export async function getGameState(
  game: GameResponse,
  seat: number | null,
  round: number | null,
): Promise<GameStateResponse> {
  const game_obj = makeGameObject(game.variant, game.config);

  for (let i = 0; i < game.moves.length; i++) {
    if (game_obj.round === round) {
      break;
    }

    const encoded_move = game.moves[i];
    const { player, move } = getOnlyMove(encoded_move);
    game_obj.playMove(player, move);
  }

  return {
    state: game_obj.exportState(seat),
    round: game_obj.round,
    next_to_play: game_obj.nextToPlay(),
    special_moves: game_obj.specialMoves(),
    result: game_obj.result,
    seat: seat,
    timeControl: game.time_control,
  };
}

// This function exists for games whose players field has not yet been defined.
// We can probably delete this after the db has been updated or cleared.
async function BACKFILL_addEmptyPlayersArray(game: GameResponse) {
  const game_id = game.id;
  const players = new Array<undefined>(
    makeGameObject(game.variant, game.config).numPlayers(),
  ).fill(null);
  await gamesCollection().updateOne(
    { _id: new ObjectId(game_id) },
    { $set: { players } },
  );
  return players;
}

function outwardFacingGame(db_game: WithId<Document>): GameResponse {
  return {
    id: db_game._id.toString(),
    variant: db_game.variant,
    moves: db_game.moves,
    config: db_game.config,
    players: db_game.players,
    time_control: db_game.time_control,
  };
}
