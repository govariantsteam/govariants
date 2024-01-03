import {
  TimeControlType,
  ITimeControlBase,
  ITimeControlConfig,
  IConfigWithTimeControl,
  makeGameObject,
  TimeControlParallel,
} from "@ogfcommunity/variants-shared";
import { AbstractGame, GameResponse } from "@ogfcommunity/variants-shared";
import { TimeoutService } from "./timeout";
import { getTimeoutService } from "./index";

/**
 * Validates whether game_config has type and
 * properties for being a config with time control.
 */
export function HasTimeControlConfig(
  game_config: unknown,
): game_config is IConfigWithTimeControl {
  return (
    game_config &&
    typeof game_config == "object" &&
    "time_control" in game_config
  );
}

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
  if (!HasTimeControlConfig(config)) return null;

  const handler = new timeControlHandlerMap[variant]();
  return handler.initialState(variant, config);
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
  ): ITimeControlBase;

  /**
   * Returns the time in milliseconds until this player
   * times out, provided no moves are played.
   */
  getMsUntilTimeout(game: GameResponse, playerNr: number): number;
}

class TimeHandlerSequentialMoves implements ITimeHandler {
  private _timeoutService: TimeoutService;
  constructor() {
    this._timeoutService = getTimeoutService();
  }

  initialState(
    variant: string,
    config: IConfigWithTimeControl,
  ): ITimeControlBase {
    const numPlayers = makeGameObject(variant, config).numPlayers();

    const timeControl: ITimeControlBase = {
      moveTimestamps: [],
      forPlayer: {},
    };

    for (let i = 0; i < numPlayers; i++) {
      timeControl.forPlayer[i] = {
        remainingTimeMS: config.time_control.mainTimeMS,
        onThePlaySince: null,
      };
    }

    switch (config.time_control.type) {
      case TimeControlType.Absolute: {
        // nothing to do
        break;
      }

      case TimeControlType.Fischer: {
        // nothing to do
        break;
      }

      default: {
        console.error("received config with invalid time control type");
      }
    }

    return timeControl;
  }

  handleMove(
    game: GameResponse,
    game_obj: AbstractGame<unknown, unknown>,
    playerNr: number,
  ): ITimeControlBase {
    const config = game.config as IConfigWithTimeControl;

    switch (config.time_control.type) {
      case TimeControlType.Absolute: {
        let timeControl = game.time_control;
        // could happen for old games
        if (timeControl === undefined) {
          timeControl = this.initialState(game.variant, config);
        }
        const playerData = timeControl.forPlayer[playerNr];
        const timestamp = new Date();

        timeControl.moveTimestamps.push(timestamp);

        if (playerData.onThePlaySince !== null) {
          playerData.remainingTimeMS -=
            timestamp.getTime() - playerData.onThePlaySince.getTime();
        }
        playerData.onThePlaySince = null;
        this._timeoutService.clearPlayerTimeout(game.id, playerNr);

        // time control starts only after the first move of player
        const nextPlayers = game_obj
          .nextToPlay()
          .filter((playerNr) => game.moves.some((move) => playerNr in move));
        nextPlayers.forEach((player) => {
          timeControl.forPlayer[player].onThePlaySince = timestamp;
          this._timeoutService.scheduleTimeout(
            game.id,
            player,
            timeControl.forPlayer[player].remainingTimeMS,
          );
        });

        return timeControl;
      }

      case TimeControlType.Invalid:
        throw Error(`game with id ${game.id} has invalid time control type`);
    }
  }

  getMsUntilTimeout(game: GameResponse, playerNr: number): number | null {
    if (!HasTimeControlConfig(game.config)) {
      console.log("has no time control config");

      return null;
    }

    switch (game.config.time_control.type) {
      case TimeControlType.Absolute:
      case TimeControlType.Fischer: {
        const times: ITimeControlBase = game.time_control;

        if (times === undefined || times.forPlayer === undefined) {
          // old game with no moves
          return null;
        }

        const playerTime = times.forPlayer[playerNr];

        if (playerTime === undefined || playerTime.onThePlaySince === null) {
          // player has not played a move yet
          // or player is not on the play
          return null;
        }

        const timeoutTime =
          playerTime.onThePlaySince.getTime() + playerTime.remainingTimeMS;

        return timeoutTime - new Date().getTime();
      }
      default: {
        console.error(`game with id ${game.id} has invalid time control type`);
        return;
      }
    }
  }
}

class TimeHandlerParallelMoves implements ITimeHandler {
  private _timeoutService: TimeoutService;
  constructor() {
    this._timeoutService = getTimeoutService();
  }

  initialState(
    variant: string,
    config: IConfigWithTimeControl,
  ): TimeControlParallel {
    const numPlayers = makeGameObject(variant, config).numPlayers();

    const timeControl: TimeControlParallel = {
      moveTimestamps: [],
      forPlayer: {},
    };

    for (let i = 0; i < numPlayers; i++) {
      timeControl.forPlayer[i] = {
        remainingTimeMS: config.time_control.mainTimeMS,
        onThePlaySince: null,
        stagedMoveAt: null,
      };
    }

    switch (config.time_control.type) {
      case TimeControlType.Absolute: {
        // nothing to do
        break;
      }

      case TimeControlType.Fischer: {
        // nothing to do
        break;
      }

      default: {
        console.error("received config with invalid time control type");
      }
    }

    return timeControl;
  }

  handleMove(
    game: GameResponse,
    game_obj: AbstractGame<unknown, unknown>,
    playerNr: number,
  ): ITimeControlBase {
    const config = game.config as IConfigWithTimeControl;

    switch (config.time_control.type) {
      case TimeControlType.Absolute: {
        let timeControl = game.time_control as TimeControlParallel;
        // could happen for old games
        if (timeControl === undefined) {
          timeControl = this.initialState(game.variant, config);
        }

        const playerTimeControl = timeControl.forPlayer[playerNr];
        const timestamp = new Date();

        if (
          playerTimeControl.onThePlaySince !== null &&
          timeControl.forPlayer[playerNr].remainingTimeMS <=
            timestamp.getTime() - playerTimeControl.onThePlaySince.getTime()
        ) {
          throw new Error(
            "you can't change your move because it would reduce your remaining time to zero.",
          );
        }

        timeControl.moveTimestamps.push(timestamp);
        timeControl.forPlayer[playerNr].stagedMoveAt = timestamp;
        this._timeoutService.clearPlayerTimeout(game.id, playerNr);

        // check if the round finishes with this move
        //
        // I'm not sure if this will always work as intended
        // because this is the game object after the move has been played
        // whereas we actually need the players that are on the play in the round that the move belongs to
        if (
          game_obj
            .nextToPlay()
            .every(
              (player_nr) =>
                timeControl.forPlayer[player_nr].stagedMoveAt !== null,
            )
        ) {
          for (const player_nr of game_obj.nextToPlay()) {
            const playerData = timeControl.forPlayer[player_nr];

            // time control starts only after first move of player
            if (
              game.moves.filter((move) => player_nr in move).length >
              (player_nr === playerNr ? 0 : 1)
            ) {
              playerData.remainingTimeMS -=
                playerData.stagedMoveAt.getTime() -
                playerData.onThePlaySince.getTime();
            }

            this._timeoutService.scheduleTimeout(
              game.id,
              player_nr,
              timeControl.forPlayer[player_nr].remainingTimeMS,
            );
            playerData.onThePlaySince = timestamp;
            playerData.stagedMoveAt = null;
          }
        }

        return timeControl;
      }

      case TimeControlType.Invalid:
        throw Error(`game with id ${game.id} has invalid time control type`);
    }
  }

  getMsUntilTimeout(game: GameResponse, playerNr: number): number {
    if (!HasTimeControlConfig(game.config)) {
      console.log("has no time control config");

      return null;
    }

    switch (game.config.time_control.type) {
      case TimeControlType.Absolute:
      case TimeControlType.Fischer: {
        const times: TimeControlParallel =
          game.time_control as TimeControlParallel;

        if (times === undefined || times.forPlayer === undefined) {
          // old game with no moves
          return null;
        }

        const playerTime = times.forPlayer[playerNr];

        if (playerTime === undefined || playerTime.onThePlaySince === null) {
          // player has not played a move yet
          // or player is not on the play
          return null;
        }

        if (playerTime.stagedMoveAt !== null) {
          return null;
        }

        const timeoutTime =
          playerTime.onThePlaySince.getTime() + playerTime.remainingTimeMS;

        return timeoutTime - new Date().getTime();
      }

      default: {
        console.error(`game with id ${game.id} has invalid time control type`);
        return;
      }
    }
  }
}

export const timeControlHandlerMap: {
  [variant: string]: new () => ITimeHandler;
} = {
  baduk: TimeHandlerSequentialMoves,
  badukWithAbstractBoard: TimeHandlerSequentialMoves,
  phantom: TimeHandlerSequentialMoves,
  parallel: TimeHandlerParallelMoves,
  capture: TimeHandlerSequentialMoves,
};
