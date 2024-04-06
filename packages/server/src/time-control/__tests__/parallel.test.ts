import {
  GameResponse,
  IConfigWithTimeControl,
  IFischerConfig,
  ParallelGo,
  ParallelGoConfig,
  PerPlayerTimeControlParallel,
  TimeControlType,
} from "@ogfcommunity/variants-shared";
import { TestClock } from "../clock";
import { TimeHandlerParallelMoves } from "../time-handler-parallel";
import { TestTimeoutService } from "../mocks/timeout-service.mock";

const MS_SINCE_EPOCH = 1_700_000_000_000;
const DATE1 = new Date(MS_SINCE_EPOCH);
const DATE2 = new Date(MS_SINCE_EPOCH + 5000);
const DATE3 = new Date(MS_SINCE_EPOCH + 10_000);
const DATE4 = new Date(MS_SINCE_EPOCH + 15_000);
const TIMEOUT_DATE = new Date(MS_SINCE_EPOCH + 400000); // timeout and then some

function baseGameConfig() {
  return {
    ...new ParallelGo().defaultConfig(),
    time_control: {
      type: TimeControlType.Fischer,
      mainTimeMS: 300000,
      maxTimeMS: 500000,
      incrementMS: 10000,
    } as IFischerConfig,
  };
}
function baseGameResponse(): GameResponse {
  return {
    id: "xxxxxx",
    variant: "parallel",
    moves: [],
    config: baseGameConfig(),
    time_control: {
      moveTimestamps: [],
      forPlayer: {
        "0": {
          clockState: { remainingTimeMS: 300000 },
          onThePlaySince: null,
          stagedMoveAt: null,
        } as PerPlayerTimeControlParallel,
        "1": {
          clockState: { remainingTimeMS: 300000 },
          onThePlaySince: null,
          stagedMoveAt: null,
        } as PerPlayerTimeControlParallel,
      },
    },
  };
}
function makeHandlerWithCurrentTime(date: Date) {
  const clock = new TestClock(date);
  const timeoutService = new TestTimeoutService();
  return new TimeHandlerParallelMoves(clock, timeoutService);
}

test("initialState (Fischer)", () => {
  const handler = makeHandlerWithCurrentTime(new Date(1_700_000_000_000));

  const state = handler.initialState("parallel", baseGameConfig());

  expect(state).toEqual({
    moveTimestamps: [],
    forPlayer: {
      "0": {
        clockState: { remainingTimeMS: 300000 },
        onThePlaySince: null,
        stagedMoveAt: null,
      },
      "1": {
        clockState: { remainingTimeMS: 300000 },
        onThePlaySince: null,
        stagedMoveAt: null,
      },
    },
  });
});

test("handleMove - staged move (Fischer)", () => {
  const handler = makeHandlerWithCurrentTime(DATE1);
  const game = new ParallelGo(baseGameConfig());

  const time_control = handler.handleMove(
    baseGameResponse(),
    game,
    0,
    "aa",
    false,
  );

  expect(time_control).toEqual({
    moveTimestamps: [DATE1],
    forPlayer: {
      "0": {
        clockState: { remainingTimeMS: 300000 },
        onThePlaySince: null,
        stagedMoveAt: DATE1,
      },
      "1": {
        clockState: { remainingTimeMS: 300000 },
        onThePlaySince: null,
        stagedMoveAt: null,
      },
    },
  });
});

test("handleMove - round transition (Fischer)", () => {
  const handler = makeHandlerWithCurrentTime(DATE4);
  const game = new ParallelGo(baseGameConfig());

  const gameResponse = baseGameResponse();
  gameResponse.moves.push({ 0: "aa" }, { 1: "bb" }, { 0: "cc" });
  gameResponse.time_control.moveTimestamps.push(DATE1, DATE2, DATE3);

  const black_tc = gameResponse.time_control.forPlayer[
    "0"
  ] as PerPlayerTimeControlParallel;
  const white_tc = gameResponse.time_control.forPlayer[
    "1"
  ] as PerPlayerTimeControlParallel;
  black_tc.stagedMoveAt = DATE3;
  black_tc.onThePlaySince = DATE2;
  white_tc.onThePlaySince = DATE2;

  const time_control = handler.handleMove(gameResponse, game, 1, "dd", true);

  expect(time_control).toEqual({
    moveTimestamps: [DATE1, DATE2, DATE3, DATE4],
    forPlayer: {
      "0": {
        clockState: { remainingTimeMS: 305000 },
        onThePlaySince: DATE4,
        stagedMoveAt: null,
      },
      "1": {
        clockState: { remainingTimeMS: 300000 },
        onThePlaySince: DATE4,
        stagedMoveAt: null,
      },
    },
  });
});

test("getMSUntilTimeout (Fischer)", () => {
  const handler = makeHandlerWithCurrentTime(DATE1);
  // missing time_control
  expect(
    handler.getMsUntilTimeout(
      {
        id: "",
        variant: "",
        moves: [],
        config: {},
      },
      0,
    ),
  ).toBe(null);
});

test("handleMove - missing time_control will be treated as initialState", () => {
  const handler = makeHandlerWithCurrentTime(DATE1);
  const game = new ParallelGo(baseGameConfig());
  const gameResponse = baseGameResponse();
  delete gameResponse.time_control;

  const time_control = handler.handleMove(gameResponse, game, 0, "aa", false);

  expect(time_control).toEqual({
    moveTimestamps: [DATE1],
    forPlayer: {
      "0": {
        clockState: { remainingTimeMS: 300000 },
        onThePlaySince: null,
        stagedMoveAt: DATE1,
      },
      "1": {
        clockState: { remainingTimeMS: 300000 },
        onThePlaySince: null,
        stagedMoveAt: null,
      },
    },
  });
});

test("handleMove - timeout sets the clock to zero (Fischer)", () => {
  const handler = makeHandlerWithCurrentTime(TIMEOUT_DATE);
  const game = new ParallelGo(baseGameConfig());
  const gameResponse = baseGameResponse();
  gameResponse.time_control.moveTimestamps = [DATE1, DATE2];
  const black_tc = gameResponse.time_control.forPlayer[
    "0"
  ] as PerPlayerTimeControlParallel;
  const white_tc = gameResponse.time_control.forPlayer[
    "1"
  ] as PerPlayerTimeControlParallel;
  black_tc.stagedMoveAt = null;
  white_tc.stagedMoveAt = null;
  black_tc.onThePlaySince = DATE2;
  white_tc.onThePlaySince = DATE2;

  const time_control = handler.handleMove(
    gameResponse,
    game,
    0,
    "timeout",
    false,
  );

  expect(time_control).toEqual({
    moveTimestamps: [DATE1, DATE2, TIMEOUT_DATE],
    forPlayer: {
      "0": {
        clockState: { remainingTimeMS: 0 },
        onThePlaySince: null,
        stagedMoveAt: null,
      },
      "1": {
        clockState: { remainingTimeMS: 300000 },
        onThePlaySince: DATE2,
        stagedMoveAt: null,
      },
    },
  });
});

test("handleMove - re-stage move not allowed if it will cause timeout", () => {
  const handler = makeHandlerWithCurrentTime(TIMEOUT_DATE);
  const game = new ParallelGo(baseGameConfig());

  const gameResponse = baseGameResponse();
  gameResponse.moves.push({ 0: "aa" }, { 1: "bb" }, { 0: "cc" });
  gameResponse.time_control.moveTimestamps.push(DATE1, DATE2, DATE3);

  const black_tc = gameResponse.time_control.forPlayer[
    "0"
  ] as PerPlayerTimeControlParallel;
  const white_tc = gameResponse.time_control.forPlayer[
    "1"
  ] as PerPlayerTimeControlParallel;
  black_tc.stagedMoveAt = DATE3;
  white_tc.stagedMoveAt = null;
  black_tc.onThePlaySince = DATE2;
  white_tc.onThePlaySince = DATE2;

  expect(() => handler.handleMove(gameResponse, game, 0, "dd", false)).toThrow(
    "you can't change your move because it would reduce your remaining time to zero.",
  );
});

function setupFourPlayerGameFirstRound(
  numMovesPlayedInSecondRound: number = 0,
) {
  const config: IConfigWithTimeControl & ParallelGoConfig = {
    ...new ParallelGo().defaultConfig(),
    time_control: {
      type: TimeControlType.Absolute,
      mainTimeMS: 300_000,
    },
    num_players: 4,
  };

  const firstMoveDate = new Date(MS_SINCE_EPOCH + 10_000);
  const secondMoveDate = new Date(MS_SINCE_EPOCH + 20_000);
  const players = [0, 1, 2, 3];

  const game = new ParallelGo(config);
  players.forEach((player) => game.playMove(player, "aa"));

  players
    .slice(0, numMovesPlayedInSecondRound)
    .forEach((player) => game.playMove(player, "bb"));

  // kinda impossible to have all players play at the same exact time, but I think it is okay
  const moveTimestamps = players.map(() => firstMoveDate);
  const perPlayerState: PerPlayerTimeControlParallel = {
    clockState: { remainingTimeMS: 290_000 },
    onThePlaySince: firstMoveDate,
    stagedMoveAt: null,
  };
  const perPlayerStateAlreadyPlayedSecond: PerPlayerTimeControlParallel = {
    clockState: { remainingTimeMS: 280_000 },
    onThePlaySince: null,
    stagedMoveAt: secondMoveDate,
  };
  const playerStates = players.map((player) =>
    player < numMovesPlayedInSecondRound
      ? perPlayerStateAlreadyPlayedSecond
      : perPlayerState,
  );
  const gameResponse: GameResponse = {
    ...baseGameResponse(),
    config,
    time_control: {
      moveTimestamps,
      forPlayer: Object.fromEntries(
        playerStates.map((state, player) => [player.toString(), state]),
      ),
    },
  };

  return { gameResponse, game };
}

test("handleMove - four players, timeout", () => {
  const { game, gameResponse } = setupFourPlayerGameFirstRound(3);

  const clock = new TestClock(TIMEOUT_DATE);
  const timeoutService = new TestTimeoutService();
  const handler = new TimeHandlerParallelMoves(clock, timeoutService);

  const time_control = handler.handleMove(
    gameResponse,
    game,
    3,
    "timeout",
    true,
  );

  expect(timeoutService.getTimeoutTime("xxxxxx", 0)).toBeUndefined();
  expect(timeoutService.getTimeoutTime("xxxxxx", 1)).toBeUndefined();
  expect(timeoutService.getTimeoutTime("xxxxxx", 2)).toBeUndefined();
  expect(timeoutService.getTimeoutTime("xxxxxx", 3)).toBe(0);

  expect(time_control).toEqual({
    moveTimestamps: gameResponse.time_control?.moveTimestamps.concat([
      //TIMEOUT_DATE,
    ]),
    forPlayer: gameResponse.time_control?.forPlayer,
  });
});
