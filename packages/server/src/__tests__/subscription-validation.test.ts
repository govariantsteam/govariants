import { UserResponse } from "@ogfcommunity/variants-shared";
import {
  setupTestDb,
  teardownTestDb,
  clearTestDb,
  getTestClient,
} from "./helpers/setup";

vi.mock("../socket_io");
vi.mock("../index");

let validateSeatSubscription: typeof import("../socket_validation").validateSeatSubscription;

beforeAll(async () => {
  await setupTestDb();
  const mod = await import("../socket_validation");
  validateSeatSubscription = mod.validateSeatSubscription;
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

function makeUser(id: string): UserResponse {
  return { id, login_type: "persistent", username: "testuser" };
}

describe("validateSeatSubscription", () => {
  it("allows non-seat topics without validation", async () => {
    const result = await validateSeatSubscription(
      "game/507f1f77bcf86cd799439011",
      undefined,
    );
    expect(result).toBeNull();
  });

  it("rejects seat topic when no user is authenticated", async () => {
    const result = await validateSeatSubscription(
      "game/507f1f77bcf86cd799439011/0",
      undefined,
    );
    expect(result).toBe("no authenticated user");
  });

  it("rejects seat topic when game does not exist", async () => {
    const result = await validateSeatSubscription(
      "game/507f1f77bcf86cd799439011/0",
      makeUser("someuser"),
    );
    expect(result).toBe("game not found");
  });

  it("rejects seat topic when user does not occupy the seat", async () => {
    const db = await getTestDb();
    const gameResult = await db.collection("games").insertOne({
      variant: "baduk",
      config: { width: 9, height: 9, komi: 5.5 },
      moves: [],
      players: [{ id: "otheruser", username: "other" }, null],
    });

    const result = await validateSeatSubscription(
      `game/${gameResult.insertedId.toString()}/0`,
      makeUser("attacker"),
    );
    expect(result).toContain("does not occupy seat 0");
  });

  it("rejects seat topic when seat is empty", async () => {
    const db = await getTestDb();
    const gameResult = await db.collection("games").insertOne({
      variant: "baduk",
      config: { width: 9, height: 9, komi: 5.5 },
      moves: [],
      players: [null, null],
    });

    const result = await validateSeatSubscription(
      `game/${gameResult.insertedId.toString()}/0`,
      makeUser("someuser"),
    );
    expect(result).toContain("does not occupy seat 0");
  });

  it("allows seat topic when user occupies the seat", async () => {
    const db = await getTestDb();
    const gameResult = await db.collection("games").insertOne({
      variant: "baduk",
      config: { width: 9, height: 9, komi: 5.5 },
      moves: [],
      players: [{ id: "rightuser", username: "right" }, null],
    });

    const result = await validateSeatSubscription(
      `game/${gameResult.insertedId.toString()}/0`,
      makeUser("rightuser"),
    );
    expect(result).toBeNull();
  });
});
