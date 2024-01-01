import {
  GameResponse,
  makeGameObject,
  MovesType,
  User,
  getOnlyMove,
} from "@ogfcommunity/variants-shared";
import { ObjectId, WithId, Document } from "mongodb";
import { getDb } from "./db";
import { io } from "./socket_io";
import { getTimeoutService } from './index';
import {
  GetInitialTimeControl,
  HasTimeControlConfig,
  timeControlHandlerMap,
  ValidateTimeControlConfig,
} from "./time-control";

export function gamesCollection() {
  return getDb().db().collection("games");
}

/**
 * @param count number of games to return (default = 10, max = 100)
 * @param offset number of games to skip (default = 0)
 */
export async function getGames(
  count: number,
  offset: number,
): Promise<GameResponse[]> {
  const games = gamesCollection()
    .find()
    .sort({ _id: -1 })
    .skip(offset || 0)
    .limit(Math.min(count || 10, 100))
    .toArray();
  return (await games).map(outwardFacingGame);
}

export async function getGamesWithTimeControl(): Promise<GameResponse[]> {
const games = gamesCollection().find({ time_control: { $ne: null } }).toArray();
  return (await games).map(outwardFacingGame);
}

export async function getGame(id: string): Promise<GameResponse> {
  const db_game = await gamesCollection().findOne({
    _id: new ObjectId(id),
  });

  // TODO: db_game might be undefined if unknown ID is provided

  //console.log(db_game);
  const game = outwardFacingGame(db_game);
  // Legacy games don't have a players field
  // TODO: remove this code after doing proper db migration
  if (!game.players) {
    game.players = await BACKFILL_addEmptyPlayersArray(game);
  }
  //console.log(game);

  return game;
}

export async function createGame(
  variant: string,
  config: object,
): Promise<GameResponse> {
  const game = {
    variant: variant,
    moves: [] as MovesType[],
    config: config,
    time_control: GetInitialTimeControl(variant, config)
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
) {
  const game = await getGame(game_id);

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

  if (!game.players || game.players[playerNr] == null) {
    throw Error(`Seat ${playerNr} not occupied!`);
  }

  const expected_player = game.players[playerNr];

  if (expected_player.id !== user_id) {
    throw Error(
      `Not the right user: expected ${expected_player.id}, got ${user_id}`,
    );
  }

  game_obj.playMove(playerNr, new_move);

  let timeControl = game.time_control;
  if (
    HasTimeControlConfig(game.config) &&
    ValidateTimeControlConfig(game.config.time_control)
  ) {

    if (game_obj.result !== '') {
      getTimeoutService().clearGameTimeouts(game.id);

    } else {
      const timeHandler = new timeControlHandlerMap[game.variant]();
      timeControl = timeHandler.handleMove(game, game_obj, playerNr, new_move);
    }
  }

  gamesCollection()
    .updateOne({ _id: new ObjectId(game_id) }, { $push: { moves: moves }, $set: { time_control: timeControl } })
    .catch(console.log);

  game.moves.push(moves);

  io().emit(`game/${game_id}`, game);

  return game;
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
