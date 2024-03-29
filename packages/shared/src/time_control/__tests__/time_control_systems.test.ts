import {
  IFischerConfig,
  ITimeControlConfig,
  TimeControlType,
} from "../time_control.types";
import {
  AbsoluteSystem,
  ByoYomiSystem,
  CanadianSystem,
  FischerSystem,
  IBasicTimeState,
  IByoYomiConfig,
  IByoYomiState,
  ICanadianTimeConfig,
  ICanadianTimeState,
  SimpleSystem,
  TimeControlSystem,
} from "../time_control_systems";

describe("Fischer", () => {
  const fischerConfig = {
    type: TimeControlType.Fischer,
    mainTimeMS: 600000, // 10 minutes
    incrementMS: 5000, // 5 seconds increment
    maxTimeMS: 1200000, // 20 minutes maximum time
  } as const;

  // FischerSystem doesn't hold its own state, so we can re-use the same
  // object in all the tests.
  const fischerSystem: TimeControlSystem<IFischerConfig, IBasicTimeState> =
    new FischerSystem();

  test("initialState returns the correct initial state", () => {
    const initialState = fischerSystem.initialState(fischerConfig);
    expect(initialState).toEqual({ remainingTimeMS: 600000 });
  });

  test("elapse subtracts elapsed time from remaining time", () => {
    const initialState = fischerSystem.initialState(fischerConfig);
    const updatedState = fischerSystem.elapse(
      30000,
      initialState,
      fischerConfig,
    );
    expect(updatedState.remainingTimeMS).toEqual(570000); // 10 minutes - 30 seconds
  });

  test("renew updates the remaining time with increment if not exceeding maxTime", () => {
    const initialState = fischerSystem.initialState(fischerConfig);
    const renewedState = fischerSystem.renew(initialState, fischerConfig);
    expect(renewedState.remainingTimeMS).toEqual(605000); // 10 minutes + 5 seconds increment
  });

  test("renew caps remaining time at maxTime if specified", () => {
    const configWithMaxTime = {
      ...fischerConfig,
      mainTimeMS: 1190000,
      incrementMS: 20000,
    }; // main time + increment > max time
    const initialState = fischerSystem.initialState(configWithMaxTime);
    const renewedState = fischerSystem.renew(initialState, configWithMaxTime);
    expect(renewedState.remainingTimeMS).toEqual(1200000); // Should cap at maxTime (20 minutes)
  });

  test("time is uncapped if max time is null", () => {
    const config = {
      ...fischerConfig,
      maxTimeMS: null,
      mainTimeMS: 1190000,
      incrementMS: 20000,
    }; // main time + increment > max time
    const initialState = fischerSystem.initialState(config);
    const renewedState = fischerSystem.renew(initialState, config);
    expect(renewedState.remainingTimeMS).toEqual(1210000);
  });

  test("msUntilTimeout returns the correct time until timeout", () => {
    const initialState = fischerSystem.initialState(fischerConfig);
    const timeUntilTimeout = fischerSystem.msUntilTimeout(
      initialState,
      fischerConfig,
    );
    expect(timeUntilTimeout).toEqual(600000); // Initial remaining time
  });

  test("timeString returns the correct string representation of time", () => {
    const initialState = fischerSystem.initialState(fischerConfig);
    const timeString = fischerSystem.timeString(initialState);
    expect(timeString).toEqual("10:00"); // Initial remaining time in MM:SS format
  });
});

describe("Byo-Yomi", () => {
  const byoYomiConfig = {
    type: TimeControlType.ByoYomi,
    mainTimeMS: 600000, // 10 minutes
    numPeriods: 3, // 3 periods
    periodTimeMS: 30000, // 30 seconds per period
  } as const;

  // ByoYomiSystem doesn't hold its own state, so we can re-use the same
  // object in all the tests.
  const byoYomiSystem: TimeControlSystem<IByoYomiConfig, IByoYomiState> =
    new ByoYomiSystem();

  test("initialState returns the correct initial state", () => {
    const initialState = byoYomiSystem.initialState(byoYomiConfig);
    expect(initialState).toEqual({
      mainTimeRemainingMS: 600000,
      periodsRemaining: 3,
      periodTimeRemainingMS: 30000,
    });
  });

  test("elapse subtracts elapsed time from remaining time", () => {
    const initialState = byoYomiSystem.initialState(byoYomiConfig);
    const updatedState = byoYomiSystem.elapse(
      45000,
      initialState,
      byoYomiConfig,
    );
    expect(updatedState.mainTimeRemainingMS).toEqual(555000); // 10 minutes - 45 seconds
  });

  test("elapse (timeout)", () => {
    const initialState = byoYomiSystem.initialState(byoYomiConfig);
    const timeoutState = byoYomiSystem.elapse(
      695000,
      initialState,
      byoYomiConfig,
    ); // 5 seconds past the end
    expect(timeoutState).toEqual({
      mainTimeRemainingMS: 0,
      periodsRemaining: 0,
      periodTimeRemainingMS: 0,
    });
  });

  test("renew resets the period time", () => {
    const initialState = byoYomiSystem.initialState(byoYomiConfig);
    const overtimeState = byoYomiSystem.elapse(
      615000,
      initialState,
      byoYomiConfig,
    ); // main time + 15s
    const renewedState = byoYomiSystem.renew(overtimeState, byoYomiConfig);
    expect(renewedState.periodTimeRemainingMS).toEqual(30000); // Should reset period time
  });

  test("msUntilTimeout returns the correct time until timeout", () => {
    const initialState = byoYomiSystem.initialState(byoYomiConfig);
    const timeUntilTimeout = byoYomiSystem.msUntilTimeout(
      initialState,
      byoYomiConfig,
    );
    expect(timeUntilTimeout).toEqual(690000); // 10 minutes + 30s x 3
  });

  test("timeString returns the correct string representation of time", () => {
    const initialState = byoYomiSystem.initialState(byoYomiConfig);
    const timeString = byoYomiSystem.timeString(initialState);
    expect(timeString).toEqual("10:00 + 00:30 (3)"); // Initial remaining time and period time
  });

  test("timeString (overtime)", () => {
    const initialState = byoYomiSystem.initialState(byoYomiConfig);
    const state = byoYomiSystem.elapse(645000, initialState, byoYomiConfig); // main time + 45s
    const timeString = byoYomiSystem.timeString(state);
    expect(timeString).toEqual("00:15 (2)"); // period time only
  });
});

describe("AbsoluteSystem", () => {
  const absoluteConfig = {
    type: TimeControlType.Absolute,
    mainTimeMS: 600000, // 10 minutes
  };

  const absoluteSystem: TimeControlSystem<ITimeControlConfig, IBasicTimeState> =
    new AbsoluteSystem();

  test("initialState returns the correct initial state", () => {
    const initialState = absoluteSystem.initialState(absoluteConfig);
    expect(initialState).toEqual({ remainingTimeMS: 600000 });
  });

  test("elapse subtracts elapsed time from remaining time", () => {
    const initialState = absoluteSystem.initialState(absoluteConfig);
    const updatedState = absoluteSystem.elapse(
      45000,
      initialState,
      absoluteConfig,
    );
    expect(updatedState.remainingTimeMS).toEqual(555000); // 10 minutes - 45 seconds
  });

  test("renew does nothing", () => {
    const initialState = absoluteSystem.initialState(absoluteConfig);
    const elapsedState = absoluteSystem.elapse(
      45000,
      initialState,
      absoluteConfig,
    );
    const renewedState = absoluteSystem.renew(elapsedState, absoluteConfig);
    expect(elapsedState).toEqual(renewedState);
  });

  test("msUntilTimeout returns the correct time until timeout", () => {
    const initialState = absoluteSystem.initialState(absoluteConfig);
    const timeUntilTimeout = absoluteSystem.msUntilTimeout(
      initialState,
      absoluteConfig,
    );
    expect(timeUntilTimeout).toEqual(600000); // Initial remaining time
  });

  test("timeString", () => {
    const initialState = absoluteSystem.initialState(absoluteConfig);
    const timeString = absoluteSystem.timeString(initialState);
    expect(timeString).toBe("10:00"); // Initial remaining time in MM:SS format
  });
});

describe("CanadianSystem", () => {
  const canadianConfig = {
    type: TimeControlType.Canadian,
    mainTimeMS: 600000, // 10 minutes
    numPeriods: 3, // 3 periods in a block
    periodTimeMS: 30000, // 30 seconds of period time
  } as const;

  const canadianSystem: TimeControlSystem<
    ICanadianTimeConfig,
    ICanadianTimeState
  > = new CanadianSystem();

  test("initialState returns the correct initial state", () => {
    const initialState = canadianSystem.initialState(canadianConfig);
    expect(initialState).toEqual({
      mainTimeRemainingMS: 600000,
      periodTimeRemainingMS: 30000,
      renewalCountdown: 3,
    });
  });

  test("elapse & renew (main time)", () => {
    const initialState = canadianSystem.initialState(canadianConfig);
    const elapsedState = canadianSystem.elapse(
      45000,
      initialState,
      canadianConfig,
    );
    const renewedState = canadianSystem.renew(elapsedState, canadianConfig);

    expect(elapsedState.mainTimeRemainingMS).toBe(555000); // 10 minutes - 45 seconds
    // renewal does nothing in main time
    expect(elapsedState).toEqual(renewedState);
  });

  test("elapse & renew (overtime)", () => {
    let state = canadianSystem.initialState({
      ...canadianConfig,
      mainTimeMS: 0, // renew
    });

    state = canadianSystem.elapse(5000, state, canadianConfig);
    expect(state.renewalCountdown).toBe(3); // elapse doesn't update the countdown
    state = canadianSystem.renew(state, canadianConfig);
    expect(state.periodTimeRemainingMS).toBe(25000); // 25 seconds
    expect(state.renewalCountdown).toBe(2);

    state = canadianSystem.elapse(5000, state, canadianConfig);
    expect(state.renewalCountdown).toBe(2); // elapse doesn't update the countdown
    state = canadianSystem.renew(state, canadianConfig);
    expect(state.periodTimeRemainingMS).toBe(20000); // 20 seconds
    expect(state.renewalCountdown).toBe(1);

    // fully renews once every 3 moves
    state = canadianSystem.elapse(5000, state, canadianConfig);
    expect(state.periodTimeRemainingMS).toBe(15000); // 15 seconds
    expect(state.renewalCountdown).toBe(1); // elapse doesn't update the countdown
    state = canadianSystem.renew(state, canadianConfig);
    expect(state.periodTimeRemainingMS).toBe(30000); // 30 seconds
    expect(state.renewalCountdown).toBe(3);
  });

  test("msUntilTimeout returns the correct time until timeout", () => {
    const initialState = canadianSystem.initialState(canadianConfig);
    const timeUntilTimeout = canadianSystem.msUntilTimeout(
      initialState,
      canadianConfig,
    );
    expect(timeUntilTimeout).toEqual(630000); // 10 minutes + 30 seconds (first period)
  });

  test("timeString returns the correct string representation of time", () => {
    const initialState = canadianSystem.initialState(canadianConfig);
    const timeString = canadianSystem.timeString(initialState);
    expect(timeString).toEqual("10:00 + 00:30/3"); // Initial remaining time, period time, and countdown
  });

  test("timeString (overtime)", () => {
    let state = canadianSystem.initialState(canadianConfig);
    state = canadianSystem.elapse(615000, state, canadianConfig); // main time + 15s
    state = canadianSystem.renew(state, canadianConfig);
    const timeString = canadianSystem.timeString(state);

    expect(timeString).toEqual("00:15/2"); // period time only
  });
});

describe("SimpleSystem", () => {
  const simpleConfig = {
    type: TimeControlType.Simple,
    mainTimeMS: 30000, // 30 seconds
  };

  const simpleSystem: TimeControlSystem<ITimeControlConfig, IBasicTimeState> =
    new SimpleSystem();

  test("initialState returns the correct initial state", () => {
    const initialState = simpleSystem.initialState(simpleConfig);
    expect(initialState).toEqual({ remainingTimeMS: 30000 });
  });

  test("elapse subtracts elapsed time from remaining time", () => {
    const initialState = simpleSystem.initialState(simpleConfig);
    const updatedState = simpleSystem.elapse(15000, initialState, simpleConfig);
    expect(updatedState.remainingTimeMS).toEqual(15000); // 10 minutes - 45 seconds
  });

  test("renew resets the remaining time to main time", () => {
    const initialState = simpleSystem.initialState(simpleConfig);
    const elapsedState = simpleSystem.elapse(15000, initialState, simpleConfig);
    const renewedState = simpleSystem.renew(elapsedState, simpleConfig);
    expect(renewedState.remainingTimeMS).toEqual(30000); // Should reset remaining time to main time
  });

  test("msUntilTimeout returns the correct time until timeout", () => {
    const initialState = simpleSystem.initialState(simpleConfig);
    const timeUntilTimeout = simpleSystem.msUntilTimeout(
      initialState,
      simpleConfig,
    );
    expect(timeUntilTimeout).toEqual(30000); // Initial remaining time
  });

  test("timeString returns the correct string representation of time", () => {
    const initialState = simpleSystem.initialState(simpleConfig);
    const timeString = simpleSystem.timeString(initialState);
    expect(timeString).toEqual("00:30"); // Initial remaining time in MM:SS format
  });
});
