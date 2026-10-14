import { GameResponse, Notifications } from "@govariants/shared";
import { ObjectId } from "mongodb";
import { setupTestDb, teardownTestDb, clearTestDb } from "./helpers/setup";

vi.mock("../socket_io");
vi.mock("../index");

import { resetMocks as resetSocketIoMocks } from "../__mocks__/socket_io";

// updateRatings looks players up via `new ObjectId(id)`, which throws on
// anything that isn't a valid ObjectId string.
const ALICE = new ObjectId().toString();
const BOB = new ObjectId().toString();

// Imported after the test database is set up — see helpers/setup.ts
let games: typeof import("../games");
let notifications: typeof import("../notifications/notifications");

beforeAll(async () => {
  await setupTestDb();
  games = await import("../games");
  notifications = await import("../notifications/notifications");
});

afterAll(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  await notifications.initUserNotifications(ALICE);
  await notifications.initUserNotifications(BOB);
  resetSocketIoMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("playMove ending the game on a round transition", () => {
  it("leaves only a gameEnd notification, not a stale myMove/newRound pair", async () => {
    const subscriptions = {
      [ALICE]: [
        Notifications.myMove,
        Notifications.newRound,
        Notifications.gameEnd,
      ],
      [BOB]: [
        Notifications.myMove,
        Notifications.newRound,
        Notifications.gameEnd,
      ],
    };

    const insertResult = await games.gamesCollection().insertOne({
      variant: "baduk",
      moves: [],
      config: { width: 1, height: 1, komi: 0 },
      players: [ALICE, BOB],
      subscriptions,
      createdAt: new Date(),
    });
    const gameId = insertResult.insertedId.toString();

    const game: GameResponse = {
      id: gameId,
      variant: "baduk",
      moves: [],
      config: { width: 1, height: 1, komi: 0 },
      players: [{ id: ALICE }, { id: BOB }],
      subscriptions,
    };

    // games.ts fires these without awaiting them. Spying lets the test
    // await the real writes instead of guessing how long they take.
    const newRoundSpy = vi.spyOn(notifications, "notifyOfNewRound");
    const gameEndSpy = vi.spyOn(notifications, "notifyOfGameEnd");

    // Two passes end the game.
    await games.handleMoveAndTime(gameId, { 0: "pass" }, game);
    await games.handleMoveAndTime(gameId, { 1: "pass" }, game);

    await Promise.all(
      [...newRoundSpy.mock.results, ...gameEndSpy.mock.results].map(
        (result) => result.value,
      ),
    );

    const aliceNotifications = await notifications.getUserNotifications(ALICE);
    expect(aliceNotifications.map((n) => n.type).sort()).toEqual([
      Notifications.gameEnd,
    ]);
  });
});
