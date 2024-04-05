import {
  Baduk,
  IFischerConfig,
  IPerPlayerTimeControlBase,
  TimeControlType,
} from "@ogfcommunity/variants-shared";
import {
  getMsUntilTimeout,
  initialState,
  makeTransition,
} from "../time-handler-utils";

const ABSOLUTE_CONFIG = {
  ...new Baduk().defaultConfig(),
  time_control: { type: TimeControlType.Absolute, mainTimeMS: 600_000 },
};

test("initialState (Absolute)", () => {
  expect(initialState("baduk", ABSOLUTE_CONFIG)).toEqual({
    moveTimestamps: [],
    forPlayer: {
      "0": { clockState: { remainingTimeMS: 600000 }, onThePlaySince: null },
      "1": { clockState: { remainingTimeMS: 600000 }, onThePlaySince: null },
    },
  });
});

test("makeTransition (Absolute)", () => {
  const transition = makeTransition(
    () => 5000,
    ABSOLUTE_CONFIG,
    "aa",
    "game_id",
  );
  const playerData: IPerPlayerTimeControlBase = {
    clockState: { remainingTimeMS: 600000 },
    onThePlaySince: null,
  };
  transition(playerData);
  expect(playerData.clockState).toEqual({ remainingTimeMS: 595000 });
});

test("makeTransition: timeout (Absolute)", () => {
  const transition = makeTransition(
    () => 600005, // Timeout plus a bit
    ABSOLUTE_CONFIG,
    "timeout",
    "game_id",
  );
  const playerData: IPerPlayerTimeControlBase = {
    clockState: { remainingTimeMS: 600000 },
    onThePlaySince: null,
  };
  transition(playerData);
  expect(playerData.clockState).toEqual({ remainingTimeMS: 0 });
});

test("makeTransition: timeout (Fischer)", () => {
  const fischerConfig = {
    ...new Baduk().defaultConfig(),
    time_control: {
      type: TimeControlType.Fischer,
      mainTimeMS: 600_000,
      maxTimeMS: null,
      incrementMS: 5000,
    } as IFischerConfig,
  };
  const transition = makeTransition(
    () => 600005, // Timeout plus a bit
    fischerConfig,
    "timeout",
    "game_id",
  );
  const playerData: IPerPlayerTimeControlBase = {
    clockState: { remainingTimeMS: 600000 },
    onThePlaySince: null,
  };
  transition(playerData);
  expect(playerData.clockState).toEqual({ remainingTimeMS: 0 });
});

test("makeTransition: (Uncapped Fischer)", () => {
  const fischerConfig = {
    ...new Baduk().defaultConfig(),
    time_control: {
      type: TimeControlType.Fischer,
      mainTimeMS: 600_000,
      maxTimeMS: null,
      incrementMS: 5000,
    } as IFischerConfig,
  };
  const transition = makeTransition(
    () => 2000, // Timeout plus a bit
    fischerConfig,
    "aa",
    "game_id",
  );
  const playerData: IPerPlayerTimeControlBase = {
    clockState: { remainingTimeMS: 600_000 },
    onThePlaySince: null,
  };
  transition(playerData);
  expect(playerData.clockState).toEqual({ remainingTimeMS: 603_000 });
});

test("makeTransition (Invalid)", () => {
  const invalidConfig = {
    ...new Baduk().defaultConfig(),
    time_control: { type: TimeControlType.Invalid, mainTimeMS: 600_000 },
  };
  expect(() =>
    makeTransition(() => 5000, invalidConfig, "aa", "game_id"),
  ).toThrow("invalid");
});

test("msUntilTimeout (Absolute)", () => {
  const playerData: IPerPlayerTimeControlBase = {
    clockState: { remainingTimeMS: 600000 },
    // player has not played a move yet
    // or player is not on the play
    onThePlaySince: null,
  };
  const ms = getMsUntilTimeout(
    {
      id: "",
      variant: "",
      moves: [],
      config: ABSOLUTE_CONFIG,
      time_control: {
        moveTimestamps: [],
        forPlayer: { "0": playerData, "1": playerData },
      },
    },
    0,
    17_000_000_000,
  );
  expect(ms).toBe(null); // no time removed
});

test("msUntilTimeout (Absolute)", () => {
  const ms = getMsUntilTimeout(
    {
      id: "",
      variant: "",
      moves: [],
      config: ABSOLUTE_CONFIG,
      // oops no time control
    },
    0,
    17_000_000_000,
  );
  expect(ms).toBe(null); // no time removed
});
