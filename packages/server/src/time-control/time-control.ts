import {
  ITimeControlBase,
  ITimeControlConfig,
  IConfigWithTimeControl,
  HasTimeControlConfig,
} from "@ogfcommunity/variants-shared";
import { AbstractGame, GameResponse } from "@ogfcommunity/variants-shared";
import { timeControlHandlerMap } from "./time-handler-map";

/**
 * Validates whether time_control_config has type and
 * properties for being a time control config.
 */
export function ValidateTimeControlConfig(
  time_control_config: unknown,
): time_control_config is ITimeControlConfig {
  return (
    time_control_config &&
    typeof time_control_config === "object" &&
    "type" in time_control_config &&
    "mainTimeMS" in time_control_config
  );
}

/**
 * Validates whether time_control has type and
 * properties for being a basic time control data object.
 */
export function ValidateTimeControlBase(
  time_control: unknown,
): time_control is ITimeControlBase {
  return (
    time_control &&
    typeof time_control === "object" &&
    "moveTimestamps" in time_control &&
    "forPlayer" in time_control
  );
}

/**
 * Returns the initial state of a time control data object
 * for a new game, if it has time control at all.
 */
export function GetInitialTimeControl(
  variant: string,
  config: object,
): ITimeControlBase | null {
  if (
    !HasTimeControlConfig(config) ||
    !Object.keys(timeControlHandlerMap).includes(variant)
  )
    return null;

  return new timeControlHandlerMap[variant]().initialState(variant, config);
}

// validation of the config should happen before this is called
export interface ITimeHandler {
  /**
   * Returns the initial state of a time control data object
   * that this handler works with.
   */
  initialState(
    variant: string,
    config: IConfigWithTimeControl,
  ): ITimeControlBase;

  /**
   * Transitions the time control data when a move is played.
   * Schedules timeouts for next players, and cancels old
   * scheduled timeouts if necessary.
   */
  handleMove(
    game: GameResponse,
    game_obj: AbstractGame<unknown, unknown>,
    playerNr: number,
    move: string,
    isRoundTransition: boolean,
  ): ITimeControlBase;

  /**
   * Returns the time in milliseconds until this player
   * times out, provided no moves are played.
   */
  getMsUntilTimeout(game: GameResponse, playerNr: number): number;
}
