import { GameResponse, getOnlyMove, makeGameObject } from "@govariants/shared";
import { ObjectId } from "mongodb";
import { setupTestDb, teardownTestDb, clearTestDb } from "./helpers/setup";

vi.mock("../socket_io");
vi.mock("../index");

import { resetMocks as resetSocketIoMocks } from "../__mocks__/socket_io";

// updateRatings looks players up via `new ObjectId(id)`, which throws on
// anything that isn't a valid ObjectId string.
const ALICE = new ObjectId().toString();
const BOB = new ObjectId().toString();

const BADUK_CONFIG = { width: 1, height: 1, komi: 0 };

// Imported after the test database is set up — see helpers/setup.ts
let games: typeof import("../games");

beforeAll(async () => {
  await setupTestDb();
  games = await import("../games");
});

afterAll(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  resetSocketIoMocks();
});

async function storedPhase(game_id: string): Promise<string | undefined> {
  const db_game = await games
    .gamesCollection()
    .findOne({ _id: new ObjectId(game_id) });
  return db_game?.phase;
}

/** A created game, with players seated so moves can be played on it. */
async function seatedGame(
  variant: string,
  config: object,
): Promise<GameResponse> {
  const created = await games.createGame(variant, config);
  return { ...created, players: [{ id: ALICE }, { id: BOB }] };
}

describe("the stored game phase", () => {
  it("is 'play' on a newly created game", async () => {
    const game = await games.createGame("baduk", BADUK_CONFIG);

    expect(await storedPhase(game.id)).toBe("play");
  });

  it("stays 'play' while the game is in progress", async () => {
    const game = await seatedGame("baduk", BADUK_CONFIG);

    await games.handleMoveAndTime(game.id, { 0: "pass" }, game);

    expect(await storedPhase(game.id)).toBe("play");
  });

  it("becomes 'gameover' on the move that ends the game", async () => {
    const game = await seatedGame("baduk", BADUK_CONFIG);

    // Two passes end a baduk game.
    await games.handleMoveAndTime(game.id, { 0: "pass" }, game);
    await games.handleMoveAndTime(game.id, { 1: "pass" }, game);

    expect(await storedPhase(game.id)).toBe("gameover");
  });

  it("becomes 'gameover' for a parallel game that passes out, whose result string stays empty", async () => {
    const config = {
      width: 2,
      height: 1,
      num_players: 2,
      collision_handling: "merge",
    };
    const game = await seatedGame("parallel", config);

    await games.handleMoveAndTime(game.id, { 0: "pass" }, game);
    await games.handleMoveAndTime(game.id, { 1: "pass" }, game);

    expect(await storedPhase(game.id)).toBe("gameover");

    // This is why the phase is what gets stored, and not the result: the game
    // above is finished, yet ParallelGo never set a result for it, so a stored
    // result could not stand in for "is this game finished?".
    const replay = makeGameObject("parallel", config);
    for (const moves of game.moves) {
      const { player, move } = getOnlyMove(moves);
      replay.playMove(player, move);
    }
    expect(replay.phase).toBe("gameover");
    expect(replay.result).toBe("");
  });
});

describe("getUnfinishedGamesWithTimeControl", () => {
  it("returns clocked games still in play, and skips finished ones", async () => {
    const base = {
      variant: "baduk",
      moves: [],
      config: BADUK_CONFIG,
      players: [null, null],
      createdAt: new Date(),
    };
    const time_control = { moveTimestamps: [], forPlayer: {} };

    const in_play = await games
      .gamesCollection()
      .insertOne({ ...base, time_control, phase: "play" });
    await games
      .gamesCollection()
      .insertOne({ ...base, time_control, phase: "gameover" });
    // Unclocked games never need a timeout scheduled.
    await games.gamesCollection().insertOne({ ...base, phase: "play" });

    const unfinished = await games.getUnfinishedGamesWithTimeControl();

    expect(unfinished.map((game) => game.id)).toEqual([
      in_play.insertedId.toString(),
    ]);
  });
});
