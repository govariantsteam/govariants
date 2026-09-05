import { ObjectId } from "mongodb";
import { randomBytes } from "node:crypto";
import {
  setupTestDb,
  teardownTestDb,
  clearTestDb,
  getTestClient,
} from "./helpers/setup";
import { TimeControlType } from "@govariants/shared";

vi.mock("../socket_io");
vi.mock("../index");

let getSiteStats: typeof import("../stats").getSiteStats;

const DAY_MS = 24 * 60 * 60 * 1000;

beforeAll(async () => {
  await setupTestDb();
  ({ getSiteStats } = await import("../stats"));
}, 30000);

afterAll(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await clearTestDb();
});

async function getTestDb() {
  return (await getTestClient()).db("govariants");
}

/**
 * Games and users carry no created-at field, so getSiteStats reads creation time
 * out of the ObjectId. Tests therefore have to backdate the _id, not a field.
 */
function idCreatedAt(date: Date): ObjectId {
  // ObjectId.createFromTime zero-fills the remaining bytes, so two games created
  // in the same second would collide. Randomise the tail to keep ids unique.
  const timestampHex = Math.floor(date.getTime() / 1000)
    .toString(16)
    .padStart(8, "0");
  return new ObjectId(timestampHex + randomBytes(8).toString("hex"));
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

function makeGame(overrides: Record<string, unknown> = {}) {
  return {
    _id: idCreatedAt(daysAgo(1)),
    variant: "baduk",
    config: { width: 9, height: 9, komi: 5.5 },
    moves: [] as unknown[],
    players: [null, null] as (string | null)[],
    ...overrides,
  };
}

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    _id: idCreatedAt(daysAgo(1)),
    login_type: "persistent",
    username: "someone",
    password_hash: "fake-hash",
    ...overrides,
  };
}

async function insertGames(...games: Record<string, unknown>[]) {
  await (await getTestDb()).collection("games").insertMany(games);
}

describe("getSiteStats", () => {
  it("returns zeroed stats for an empty database", async () => {
    const stats = await getSiteStats();

    expect(stats.games.total).toBe(0);
    expect(stats.users.total).toBe(0);
    expect(stats.users.activeSessions).toBe(0);
    expect(stats.variants).toEqual([]);
    expect(stats.timeControls).toEqual([]);
  });

  it("always returns twelve zero-filled weekly buckets, oldest first", async () => {
    const stats = await getSiteStats();

    expect(stats.weeklyGames).toHaveLength(12);
    expect(stats.weeklyGames.every((week) => week.games === 0)).toBe(true);

    const weekStarts = stats.weeklyGames.map((w) =>
      new Date(w.weekStart).getTime(),
    );
    const ascending = [...weekStarts].sort((a, b) => a - b);
    expect(weekStarts).toEqual(ascending);
    // Every bucket starts on a Monday, exactly one week after the previous one.
    expect(
      stats.weeklyGames.every((w) => new Date(w.weekStart).getUTCDay() === 1),
    ).toBe(true);
  });

  it("counts games created in the last week into the most recent bucket", async () => {
    await insertGames(
      makeGame({ _id: idCreatedAt(daysAgo(0)) }),
      makeGame({ _id: idCreatedAt(daysAgo(200)) }),
    );

    const stats = await getSiteStats();

    expect(stats.games.total).toBe(2);
    // The 200-day-old game falls outside the twelve-week window.
    const windowed = stats.weeklyGames.reduce((sum, w) => sum + w.games, 0);
    expect(windowed).toBe(1);
    expect(stats.weeklyGames[stats.weeklyGames.length - 1].games).toBe(1);
  });

  it("bucketizes games by recency window", async () => {
    await insertGames(
      makeGame({ _id: idCreatedAt(daysAgo(1)) }),
      makeGame({ _id: idCreatedAt(daysAgo(10)) }),
      makeGame({ _id: idCreatedAt(daysAgo(45)) }),
    );

    const stats = await getSiteStats();

    expect(stats.games.total).toBe(3);
    expect(stats.games.createdLast7Days).toBe(1);
    expect(stats.games.createdLast30Days).toBe(2);
  });

  it("treats a game as seats-filled only when no seat is null", async () => {
    await insertGames(
      makeGame({ players: [null, null] }),
      makeGame({ players: ["abc", null] }),
      makeGame({ players: ["abc", "def"] }),
    );

    const stats = await getSiteStats();

    expect(stats.games.seatsFilled).toBe(1);
  });

  it("counts played games and total moves", async () => {
    await insertGames(
      makeGame({ moves: [] }),
      makeGame({ moves: [{ 0: "aa" }, { 1: "bb" }] }),
      makeGame({ moves: [{ 0: "cc" }] }),
    );

    const stats = await getSiteStats();

    expect(stats.games.withMoves).toBe(2);
    expect(stats.games.totalMoves).toBe(3);
  });

  it("groups by variant, sorted by game count descending", async () => {
    await insertGames(
      makeGame({ variant: "baduk", players: ["a", "b"], moves: [{ 0: "aa" }] }),
      makeGame({ variant: "baduk" }),
      makeGame({ variant: "chess" }),
      makeGame({ variant: "phantom", _id: idCreatedAt(daysAgo(90)) }),
    );

    const stats = await getSiteStats();

    expect(stats.variants.map((v) => v.variant)).toEqual([
      "baduk",
      "chess",
      "phantom",
    ]);
    expect(stats.variants[0]).toEqual({
      variant: "baduk",
      games: 2,
      gamesLast30Days: 2,
      seatsFilled: 1,
      withMoves: 1,
      totalMoves: 1,
    });
    // The phantom game is older than 30 days.
    expect(stats.variants[2].gamesLast30Days).toBe(0);
  });

  it("labels time controls and folds unclocked games into Unlimited", async () => {
    await insertGames(
      makeGame({ config: { time_control: { type: TimeControlType.Fischer } } }),
      makeGame({ config: { time_control: { type: TimeControlType.Fischer } } }),
      makeGame({ config: { time_control: { type: TimeControlType.ByoYomi } } }),
      makeGame({ config: { width: 9 } }),
    );

    const stats = await getSiteStats();

    // Sorted by game count descending; ties break on the raw enum value, where
    // the null of an unclocked game sorts ahead of any number.
    expect(stats.timeControls).toEqual([
      { label: "Fischer", games: 2 },
      { label: "Unlimited", games: 1 },
      { label: "Byo-Yomi", games: 1 },
    ]);
  });

  it("splits users by login type and counts recent registrations", async () => {
    const db = await getTestDb();
    await db
      .collection("users")
      .insertMany([
        makeUser({ _id: idCreatedAt(daysAgo(1)) }),
        makeUser({ _id: idCreatedAt(daysAgo(100)) }),
        { _id: idCreatedAt(daysAgo(2)), login_type: "guest", token: "t1" },
        { _id: idCreatedAt(daysAgo(3)), login_type: "guest", token: "t2" },
      ]);

    const stats = await getSiteStats();

    expect(stats.users.total).toBe(4);
    expect(stats.users.registered).toBe(2);
    expect(stats.users.guest).toBe(2);
    expect(stats.users.registeredLast30Days).toBe(1);
  });

  it("counts only unexpired sessions as active", async () => {
    const db = await getTestDb();
    await db.collection("sessions").insertMany([
      { _id: "a", expires: new Date(Date.now() + DAY_MS) },
      { _id: "b", expires: new Date(Date.now() + 10 * DAY_MS) },
      { _id: "c", expires: new Date(Date.now() - DAY_MS) },
    ]);

    const stats = await getSiteStats();

    expect(stats.users.activeSessions).toBe(2);
  });

  it("reports no user-identifying data", async () => {
    const db = await getTestDb();
    await db.collection("users").insertOne(makeUser({ username: "alice" }));
    await insertGames(makeGame({ players: ["alice-id", "bob-id"] }));

    const serialized = JSON.stringify(await getSiteStats());

    expect(serialized).not.toContain("alice");
    expect(serialized).not.toContain("bob-id");
  });
});
