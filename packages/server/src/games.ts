import {
  GameResponse,
  makeGameObject,
  MovesType,
} from "@ogfcommunity/variants-shared";
import { ObjectId, WithId, Document } from "mongodb";
import { getDb } from "./db";

function gamesCollection() {
  return getDb().db().collection("games");
}

/**
 * @param page NOT YET IMPLEMENTED
 */
export async function getGames(page: number): Promise<GameResponse[]> {
  const games = gamesCollection().find().sort({ _id: -1 }).limit(10).toArray();
  return (await games).map(outwardFacingGame);
}

export async function getGame(id: string): Promise<GameResponse> {
  const db_game = await gamesCollection().findOne({
    _id: new ObjectId(id),
  });

  return outwardFacingGame(db_game);
}

export async function createGame(
  variant: string,
  config: object
): Promise<GameResponse> {
  const game = {
    variant: variant,
    moves: [] as MovesType[],
    config: config,
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

export async function playMove(game_id: string, move: MovesType) {
  const game = await getGame(game_id);

  // Verify that moves are legal
  const game_obj = makeGameObject(game.variant, game.config);
  game.moves.forEach((move) => {
    game_obj.playMove(move);
  });

  if (game_obj.result !== "") {
    throw Error("Game is already finished.");
  }

  game_obj.playMove(move);

  gamesCollection().updateOne(
    { _id: new ObjectId(game_id) },
    { $push: { moves: move } }
  );

  return game;
}

function outwardFacingGame(db_game: WithId<Document>): GameResponse {
  return {
    id: db_game._id.toString(),
    variant: db_game.variant,
    moves: db_game.moves,
    config: db_game.config,
  };
}