import {
  type IFischerConfig,
  type ITimeControlConfig,
  TimeControlType,
} from "./time_control.types";
import { msToTime } from "./time_control.utils";

interface TimeControlSystem<ConfigT, StateT> {
  initialState(config: ConfigT): StateT;
  /** Return an updated state to reflect the elapsed time */
  elapse(elapsedMS: number, state: StateT, config: ConfigT): StateT;
  /** Renew period time in systems like Byo-Yomi or Simple. */
  renew(state: StateT, config: ConfigT): StateT;
  msUntilTimeout(state: StateT, config: ConfigT): number;
  toString(state: StateT): string;
}

interface IBasicTimeState {
  remainingTimeMS: number;
}

export class FischerSystem
  implements TimeControlSystem<IFischerConfig, IBasicTimeState>
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

  toString(state: IBasicTimeState): string {
    return msToTime(state.remainingTimeMS);
  }
}

export class AbsoluteSystem
  implements TimeControlSystem<ITimeControlConfig, IBasicTimeState>
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

  representation(state: IBasicTimeState): string {
    return msToTime(state.remainingTimeMS);
  }
}

interface IByoYomiConfig extends ITimeControlConfig {
  type: TimeControlType.ByoYomi;
  numPeriods: number;
  periodTimeMS: number;
}
interface IByoYomiState {
  mainTimeRemainingMS: number;
  periodsRemaining: number;
  periodTimeRemainingMS: number;
}

export class ByoYomiSystem
  implements TimeControlSystem<IByoYomiConfig, IByoYomiState>
{
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
  toString(state: IByoYomiState): string {
    const periodTimeString = `${msToTime(state.periodTimeRemainingMS)} (${
      state.periodsRemaining
    })`;
    if (state.mainTimeRemainingMS > 0) {
      return `${msToTime(state.mainTimeRemainingMS)} + ${periodTimeString}`;
    }
    return periodTimeString;
  }
}

export class SimpleSystem
  implements TimeControlSystem<ITimeControlConfig, IBasicTimeState>
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

  toString(state: IBasicTimeState): string {
    return msToTime(state.remainingTimeMS);
  }
}

interface ICanadianTimeState {
  mainTimeRemainingMS: number;
  periodTimeRemainingMS: number;
  renewalCountdown: number;
}
interface ICanadianTimeConfig extends ITimeControlConfig {
  type: TimeControlType.Canadian;
  numPeriods: number;
  periodTimeMS: number;
}

export class CanadianSystem
  implements TimeControlSystem<ICanadianTimeConfig, ICanadianTimeState>
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

  toString(state: ICanadianTimeState): string {
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
function nullRenewal<T>(state: T) {
  return { ...state };
}
