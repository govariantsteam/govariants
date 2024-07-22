import {
  ITimeControlBase,
  ITimeControlConfig,
  IConfigWithTimeControl,
  HasTimeControlConfig,
  TimeControlType,
  IFischerConfig,
} from "@ogfcommunity/variants-shared";
import { AbstractGame, GameResponse } from "@ogfcommunity/variants-shared";
import { timeControlHandlerMap } from "./time-handler-map";
import { Clock } from "./clock";
import { getTimeoutService } from "..";

const _type: keyof ITimeControlConfig = "type";
const mainTimeMs: keyof ITimeControlConfig = "mainTimeMS";
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
    mainTimeMs in time_control_config &&
    (time_control_config.type !== TimeControlType.Fischer ||
      ValidateFischerConfig(time_control_config))
  );
}

const incrementMS: keyof IFischerConfig = "incrementMS";
const maxTimeMsMS: keyof IFischerConfig = "maxTimeMS";
/**
 * Validates whether time_control_config has the additional
 * properties for a Fischer time control.
 */
export function ValidateFischerConfig(time_control_config: object): boolean {
  return (
    incrementMS in time_control_config && maxTimeMsMS in time_control_config
  );
}

const moveTimestamps: keyof ITimeControlBase = "moveTimestamps";
const forplayer: keyof ITimeControlBase = "forPlayer";
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
    moveTimestamps in time_control &&
    forplayer in time_control
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

  return new timeControlHandlerMap[variant](
    new Clock(),
    getTimeoutService(),
  ).initialState(variant, config);
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
    game_obj: AbstractGame,
    playerNr: number,
    move: string,
    isRoundTransition: boolean,
  ): ITimeControlBase;

  /**
   * Returns the time in milliseconds until this player
   * times out, provided no moves are played.
   * Should only be called on a game with a time control config.
   */
  getMsUntilTimeout(game: GameResponse, playerNr: number): number;
}
