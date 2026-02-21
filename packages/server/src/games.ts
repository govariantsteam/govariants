import {
  GameResponse,
  makeGameObject,
  MovesType,
  User,
  getOnlyMove,
  HasTimeControlConfig,
  GamesFilter,
  AbstractGame,
  GameStateResponse,
  sanitizeConfig,
  ITimeControlBase,
  UserResponse,
  NotificationType,
  GameSubscriptions,
  GameInitialResponse,
  GameErrorResponse,
} from "@ogfcommunity/variants-shared";
import { ObjectId, WithId, Document, Filter, Collection } from "mongodb";
import { getDb } from "./db";
import { io } from "./socket_io";
import { getTimeoutService } from "./index";
import {
  GetInitialTimeControl,
  getTimeHandler,
  ValidateTimeControlConfig,
} from "./time-control/time-control";
import { updateRatings, supportsRatings } from "./rating/rating";
import {
  initUserNotifications,
  notifyOfGameEnd,
  notifyOfNewRound,
  notifyOfSeatChange,
} from "./notifications/notifications";

export type GameSchema = {
  variant: string;
  moves: MovesType[];
  config: object;
  players?: Array<User | undefined>;
  time_control?: ITimeControlBase;
  creator?: User;
  subscriptions?: GameSubscriptions;
};

export function gamesCollection(): Collection<GameSchema> {
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
  creator?: User,
): Promise<GameResponse> {
  // Construct a game from the config to ensure the config is valid
  const gameObj = makeGameObject(variant, config);

  const game: GameSchema = {
    variant: variant,
    moves: [] as MovesType[],
    config: config,
    time_control: GetInitialTimeControl(variant, config),
    players: new Array(gameObj.numPlayers()).fill(null),
    creator: creator,
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
    const timeHandler = getTimeHandler(game.variant);
    if (timeHandler !== null) {
      timeControl = timeHandler.handleMove(
        game,
        game_obj,
        playerNr,
        new_move,
        isRoundTransition,
      );
    }
  }

  const moveUpdateResult = await gamesCollection()
    .findOneAndUpdate(
      {
        _id: new ObjectId(game_id),
        moves: { $size: game.moves.length },
      },
      { $push: { moves: moves }, $set: { time_control: timeControl } },
    )
    .catch(console.log);
  if (!moveUpdateResult || !moveUpdateResult.lastErrorObject?.updatedExisting) {
    throw new Error("db update for adding move failed");
  }

  game.moves.push(moves);

  emitGame(game.id, game.players?.length ?? 0, game_obj, timeControl);

  if (
    game_obj.phase === "gameover" &&
    game.players.length === 2 &&
    supportsRatings(game.variant)
  ) {
    await updateRatings(game, game_obj);
  }

  if (isRoundTransition) {
    const userIdsOnThePlay = game_obj
      .nextToPlay()
      .map((index) => game.players[index]?.id)
      .filter((x) => !!x);
    notifyOfNewRound(
      game.subscriptions ?? {},
      game.id,
      game_obj.round,
      userIdsOnThePlay,
    ).catch(console.error);
  }

  if (game_obj.phase === "gameover") {
    notifyOfGameEnd(game.subscriptions ?? {}, game.id, game_obj.result).catch(
      console.error,
    );
  }

  return game;
}

function emitGame(
  game_id: string,
  num_players: number,
  game_obj: AbstractGame,
  time_control: ITimeControlBase,
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
      timeControl: time_control,
    });

  for (let seat = 0; seat < num_players; seat++) {
    const gameStateResponse: GameStateResponse = {
      state: game_obj.exportState(seat),
      round: game_obj.round,
      next_to_play: next_to_play,
      special_moves: specialMoves,
      result: game_obj.result,
      seat: seat,
      timeControl: time_control,
    };
    io().to(`game/${game_id}/${seat}`).emit("move", gameStateResponse);
  }
}

/**
 *
 * @param game_id
 * @param seat The seat to be updated (0..N)
 * @param user The user who submitted the request.
 * @param new_user The user to place in the seat. The seat will be vacated if undefined.
 * @returns
 */
async function updateSeat(
  game_id: string,
  seat: number,
  user: UserResponse,
  new_user: User | undefined,
) {
  const game = await getGame(game_id);

  // If the seat is occupied by another player, throw an error.
  if (
    game.players[seat] != null &&
    game.players[seat].id !== user.id &&
    // Admins may do as they please
    user.role !== "admin"
  ) {
    throw new Error("Seat taken!");
  }

  game.players[seat] = new_user;

  await gamesCollection().updateOne(
    { _id: new ObjectId(game_id) },
    { $set: { [`players.${seat}`]: new_user } },
  );
  await notifyOfSeatChange(
    game.subscriptions ?? {},
    game_id,
    seat,
    user.username,
    new_user !== undefined,
  );

  return game.players;
}

export function takeSeat(game_id: string, seat: number, user: UserResponse) {
  return updateSeat(game_id, seat, user, user);
}

export async function leaveSeat(
  game_id: string,
  seat: number,
  user: UserResponse,
) {
  return updateSeat(game_id, seat, user, undefined);
}

export function getGameState(
  game: GameResponse,
  seat: number | null,
  round: number | null,
): GameStateResponse {
  let game_obj = makeGameObject(game.variant, game.config);

  for (let i = 0; i < game.moves.length; i++) {
    if (round !== null && game_obj.round > round) {
      break;
    }

    const encoded_move = game.moves[i];
    const { player, move } = getOnlyMove(encoded_move);
    game_obj.playMove(player, move);
  }

  if (round !== null && game_obj.round > round) {
    // user is viewing past round
    game_obj = makeGameObject(game.variant, game.config);
    for (let i = 0; i < game.moves.length; i++) {
      if (game_obj.round === round) {
        // stop at start of round, so staged moves etc. are not included
        break;
      }

      const encoded_move = game.moves[i];
      const { player, move } = getOnlyMove(encoded_move);
      game_obj.playMove(player, move);
    }
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

export async function repairGame(gameId: string): Promise<void> {
  const game = await getGame(gameId);
  const gameInstance = makeGameObject(game.variant, game.config);
  const errorlessMoves: MovesType[] = [];
  let errorOccured = false;

  // play moves until an error occurred, if any
  try {
    game.moves.forEach((encoded_move) => {
      const { player, move } = getOnlyMove(encoded_move);
      gameInstance.playMove(player, move);
      errorlessMoves.push(encoded_move);
    });
  } catch (_error) {
    errorOccured = true;
  }

  if (errorOccured) {
    await gamesCollection().updateOne(
      { _id: new ObjectId(gameId) },
      { $set: { moves: errorlessMoves } },
    );
  }
}

export async function subscribeToGameNotifications(
  gameId: string,
  userId: string,
  types: NotificationType[],
): Promise<boolean> {
  const nestedKey = `subscriptions.${userId}`;
  const updateResult = await gamesCollection().updateOne(
    { _id: new ObjectId(gameId) },
    {
      $set: { [nestedKey]: types },
    },
  );
  await initUserNotifications(userId);

  return updateResult.matchedCount === 1;
}

export async function getGamesById(ids: string[]): Promise<GameResponse[]> {
  return (
    await gamesCollection()
      .find({
        _id: { $in: ids.map((id) => new ObjectId(id)) },
      })
      .toArray()
  ).map(outwardFacingGame);
}

function outwardFacingGame(db_game: WithId<GameSchema>): GameResponse {
  const config = sanitizeConfig(db_game.variant, db_game.config);
  return {
    id: db_game._id.toString(),
    variant: db_game.variant,
    moves: db_game.moves,
    config,
    players: db_game.players,
    time_control: db_game.time_control,
    creator: db_game.creator,
    subscriptions: db_game.subscriptions,
  };
}

export function tryComputeState(
  game: GameResponse,
  user?: User,
): GameInitialResponse | GameErrorResponse {
  try {
    const stateDto: GameInitialResponse = {
      id: game.id,
      variant: game.variant,
      config: game.config,
      creator: game.creator,
      players: game.players,
      ...getGameState(game, null, null),
    };
    if (user && game.subscriptions) {
      stateDto.subscription = game.subscriptions[user.id] ?? [];
    }
    return stateDto;
  } catch (e) {
    const errorDto: GameErrorResponse = {
      id: game.id,
      variant: game.variant,
      errorMessage: e.message,
    };
    return errorDto;
  }
}
