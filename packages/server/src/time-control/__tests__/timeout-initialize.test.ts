import {
  GameResponse,
  IFischerConfig,
  TimeControlType,
} from "@govariants/shared";
import { ObjectId } from "mongodb";
import {
  setupTestDb,
  teardownTestDb,
  clearTestDb,
} from "../../__tests__/helpers/setup";

vi.mock("../../socket_io");
vi.mock("../../index");

const ALICE = new ObjectId().toString();
const BOB = new ObjectId().toString();

const TIME_CONTROL: IFischerConfig = {
  type: TimeControlType.Fischer,
  mainTimeMS: 60_000,
  incrementMS: 5_000,
  maxTimeMS: 61_000,
};

// Imported after the test database is set up — see helpers/setup.ts
let games: typeof import("../../games");
let timeout: typeof import("../timeout");

beforeAll(async () => {
  await setupTestDb();
  games = await import("../../games");
  timeout = await import("../timeout");
});

afterAll(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await clearTestDb();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TimeoutService.initialize", () => {
  it("keeps scheduling later games after one whose config the current code rejects", async () => {
    // A 60x60 board predates the 52x52 cap, so makeGameObject throws on it.
    // Games like this exist in the wild; the phase migration logs and skips
    // them, and one could also reach the query by way of a stored phase that
    // no longer matches its moves.
    await games.gamesCollection().insertOne({
      variant: "baduk",
      moves: [],
      config: { width: 60, height: 60, komi: 6.5, time_control: TIME_CONTROL },
      players: [ALICE, BOB],
      time_control: { moveTimestamps: [], forPlayer: {} },
      createdAt: new Date(),
      phase: "play",
    });

    // A healthy clocked game, inserted after it, with both players having
    // moved so that whoever is on the play has a clock running.
    const created = await games.createGame("baduk", {
      width: 9,
      height: 9,
      komi: 6.5,
      time_control: TIME_CONTROL,
    });
    const playable: GameResponse = {
      ...created,
      players: [{ id: ALICE }, { id: BOB }],
    };
    await games.handleMoveAndTime(playable.id, { 0: "aa" }, playable);
    await games.handleMoveAndTime(playable.id, { 1: "bb" }, playable);

    const service = new timeout.TimeoutService();
    // Stubbed so the test schedules no real timers.
    const scheduleTimeout = vi
      .spyOn(service, "scheduleTimeout")
      .mockImplementation(() => {});
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await service.initialize();

    expect(scheduleTimeout).toHaveBeenCalledWith(
      playable.id,
      0,
      expect.any(Number),
    );
    // The rejected config was reported rather than thrown away silently.
    expect(consoleError).toHaveBeenCalled();
  });
});
