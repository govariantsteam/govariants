import {
  type IFischerConfig,
  type ITimeControlConfig,
  TimeControlType,
} from "./time_control.types";
import { msToTime } from "./time_control.utils";

export interface TimeControl<ConfigT, StateT> {
  initialState(config: ConfigT): StateT;
  /** Return an updated state to reflect the elapsed time */
  elapse(elapsedMS: number, state: StateT, config: ConfigT): StateT;
  /** Renew period time in systems like Byo-Yomi or Simple. */
  renew(state: StateT, config: ConfigT): StateT;
  msUntilTimeout(state: StateT, config: ConfigT): number;
  timeString(state: StateT): string;
}

export interface IBasicTimeState {
  remainingTimeMS: number;
}

class FischerTimeControl
  implements TimeControl<IFischerConfig, IBasicTimeState>
{
  initialState(config: IFischerConfig): IBasicTimeState {
    return { remainingTimeMS: config.mainTimeMS };
  }

  elapse(elapsedMS: number, state: IBasicTimeState) {
    return { remainingTimeMS: state.remainingTimeMS - elapsedMS };
  }

  renew(state: IBasicTimeState, config: IFischerConfig) {
    const uncapped = state.remainingTimeMS + config.incrementMS;

    const remainingTimeMS =
      config.maxTimeMS === null
        ? uncapped
        : Math.min(uncapped, config.maxTimeMS);

    return { remainingTimeMS };
  }

  msUntilTimeout(state: IBasicTimeState): number {
    return state.remainingTimeMS;
  }

  timeString(state: IBasicTimeState): string {
    return msToTime(state.remainingTimeMS);
  }
}

class AbsoluteTimeControl
  implements TimeControl<ITimeControlConfig, IBasicTimeState>
{
  initialState(config: ITimeControlConfig): IBasicTimeState {
    return { remainingTimeMS: config.mainTimeMS };
  }

  elapse(elapsedMS: number, state: IBasicTimeState) {
    return { remainingTimeMS: state.remainingTimeMS - elapsedMS };
  }

  renew = nullRenewal;

  msUntilTimeout(state: IBasicTimeState): number {
    return state.remainingTimeMS;
  }

  timeString(state: IBasicTimeState): string {
    return msToTime(state.remainingTimeMS);
  }
}

export interface IByoYomiConfig extends ITimeControlConfig {
  type: TimeControlType.ByoYomi;
  numPeriods: number;
  periodTimeMS: number;
}
export interface IByoYomiState {
  mainTimeRemainingMS: number;
  periodsRemaining: number;
  periodTimeRemainingMS: number;
}

class ByoYomiTimeControl implements TimeControl<IByoYomiConfig, IByoYomiState> {
  initialState(config: IByoYomiConfig): IByoYomiState {
    return {
      mainTimeRemainingMS: config.mainTimeMS,
      periodsRemaining: config.numPeriods,
      periodTimeRemainingMS: config.periodTimeMS,
    };
  }

  elapse(
    elapsedMS: number,
    state: IByoYomiState,
    config: IByoYomiConfig,
  ): IByoYomiState {
    state = { ...state };
    if (state.mainTimeRemainingMS) {
      if (state.mainTimeRemainingMS >= elapsedMS) {
        state.mainTimeRemainingMS -= elapsedMS;
        return state;
      }
      elapsedMS -= state.mainTimeRemainingMS;
      state.mainTimeRemainingMS = 0;
    }
    while (state.periodTimeRemainingMS < elapsedMS) {
      elapsedMS -= state.periodTimeRemainingMS;
      state.periodsRemaining--;
      if (state.periodsRemaining === 0) {
        state.periodTimeRemainingMS = 0;
        return state;
      }
      state.periodTimeRemainingMS = config.periodTimeMS;
    }
    state.periodTimeRemainingMS -= elapsedMS;
    return state;
  }

  renew(state: IByoYomiState, config: IByoYomiConfig) {
    return { ...state, periodTimeRemainingMS: config.periodTimeMS };
  }

  msUntilTimeout(state: IByoYomiState, config: IByoYomiConfig): number {
    const fullPeriodsRemaining = state.periodsRemaining - 1;
    return (
      state.mainTimeRemainingMS +
      state.periodTimeRemainingMS +
      fullPeriodsRemaining * config.periodTimeMS
    );
  }

  // Arguably, we'll want styling on these more complex strings.  I see a couple options:
  //   1) move this function into the vue-client package
  //   2) enable rich text output (see Vue's v-html directive)
  // But plain JS strings are easy to work with and test, so keeping it for the first pass.
  timeString(state: IByoYomiState): string {
    const periodTimeString = `${msToTime(state.periodTimeRemainingMS)} (${
      state.periodsRemaining
    })`;
    if (state.mainTimeRemainingMS > 0) {
      return `${msToTime(state.mainTimeRemainingMS)} + ${periodTimeString}`;
    }
    return periodTimeString;
  }
}

class SimpleTimeControl
  implements TimeControl<ITimeControlConfig, IBasicTimeState>
{
  initialState(config: ITimeControlConfig) {
    return {
      remainingTimeMS: config.mainTimeMS,
    };
  }

  elapse(elapsedMS: number, state: IBasicTimeState) {
    return { remainingTimeMS: state.remainingTimeMS - elapsedMS };
  }

  renew(_state: IBasicTimeState, config: ITimeControlConfig) {
    return { remainingTimeMS: config.mainTimeMS };
  }

  msUntilTimeout(state: IBasicTimeState): number {
    return state.remainingTimeMS;
  }

  timeString(state: IBasicTimeState): string {
    return msToTime(state.remainingTimeMS);
  }
}

export interface ICanadianTimeState {
  mainTimeRemainingMS: number;
  periodTimeRemainingMS: number;
  renewalCountdown: number;
}
export interface ICanadianTimeConfig extends ITimeControlConfig {
  type: TimeControlType.Canadian;
  numPeriods: number;
  periodTimeMS: number;
}

class CanadianTimeControl
  implements TimeControl<ICanadianTimeConfig, ICanadianTimeState>
{
  initialState(config: ICanadianTimeConfig) {
    return {
      mainTimeRemainingMS: config.mainTimeMS,
      periodTimeRemainingMS: config.periodTimeMS,
      renewalCountdown: config.numPeriods,
    };
  }

  elapse(elapsedMS: number, state: ICanadianTimeState) {
    state = { ...state };
    if (state.mainTimeRemainingMS) {
      if (state.mainTimeRemainingMS >= elapsedMS) {
        state.mainTimeRemainingMS -= elapsedMS;
        return state;
      }
      elapsedMS -= state.mainTimeRemainingMS;
      state.mainTimeRemainingMS = 0;
    }
    state.periodTimeRemainingMS -= elapsedMS;

    return state;
  }

  renew(state: ICanadianTimeState, config: ICanadianTimeConfig) {
    state = { ...state };
    if (state.mainTimeRemainingMS > 0) {
      // periods don't need to be renewed during main time, and we don't want
      // to touch the countdown
      return state;
    }
    state.renewalCountdown--;
    if (state.renewalCountdown === 0) {
      // reset
      state.renewalCountdown = config.numPeriods;
      state.periodTimeRemainingMS = config.periodTimeMS;
    }
    return state;
  }

  msUntilTimeout(state: ICanadianTimeState): number {
    return state.mainTimeRemainingMS + state.periodTimeRemainingMS;
  }

  timeString(state: ICanadianTimeState): string {
    const periodTimeString = `${msToTime(state.periodTimeRemainingMS)}/${
      state.renewalCountdown
    }`;
    if (state.mainTimeRemainingMS > 0) {
      return `${msToTime(state.mainTimeRemainingMS)} + ${periodTimeString}`;
    }
    return periodTimeString;
  }
}

// Convenience function for when the state doesn't change at the end of a round
function nullRenewal<T extends object>(state: T) {
  return { ...state };
}

export const timeControlMap: ReadonlyMap<
  TimeControlType,
  TimeControl<object, object>
> = new Map<TimeControlType, TimeControl<object, object>>([
  [TimeControlType.Absolute, new AbsoluteTimeControl()],
  [TimeControlType.ByoYomi, new ByoYomiTimeControl()],
  [TimeControlType.Canadian, new CanadianTimeControl()],
  [TimeControlType.Fischer, new FischerTimeControl()],
  [TimeControlType.Simple, new SimpleTimeControl()],
]);
