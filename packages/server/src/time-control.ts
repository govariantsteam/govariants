import {
  TimeControlType,
  ITimeControlBase,
  ITimeControlConfig,
  IConfigWithTimeControl,
  makeGameObject,
} from "@ogfcommunity/variants-shared";
import { AbstractGame, GameResponse } from "@ogfcommunity/variants-shared";
import { TimeoutService } from './timeout';
import { getTimeoutService } from './index';

export function HasTimeControlConfig(
  game_config: unknown,
): game_config is IConfigWithTimeControl {
  return (
    game_config &&
    typeof game_config == "object" &&
    "time_control" in game_config
  );
}

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

export function GetInitialTimeControl(variant: string, config: object): ITimeControlBase | null {
  if (!HasTimeControlConfig(config)) return null;

  const handler = new timeControlHandlerMap[variant]();
  return handler.initialState(variant, config);
}

// validation of the config should happen before this is called
export interface ITimeHandler {
  initialState(variant: string, config: IConfigWithTimeControl): ITimeControlBase;

  handleMove(
    game: GameResponse,
    game_obj: AbstractGame<unknown, unknown>,
    playerNr: number,
    move: string,
  ): ITimeControlBase;

  getMsUntilTimeout(game: GameResponse, playerNr: number): number;
}

class TimeHandlerSequentialMoves implements ITimeHandler {
  private _timeoutService: TimeoutService
  constructor() {
    this._timeoutService = getTimeoutService()
  }

  initialState(variant: string, config: IConfigWithTimeControl): ITimeControlBase {
    const numPlayers = makeGameObject(variant, config).numPlayers();

    const timeControl: ITimeControlBase = {
      moveTimestamps: [],
      forPlayer: {},
    };

    for (let i = 0; i < numPlayers; i++) {
      timeControl.forPlayer[i] = {
        remainingTimeMS: config.time_control.mainTimeMS,
        onThePlaySince: null
      }
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
        console.error('received config with invalid time control type');
      }
    }

    return timeControl
  }

  handleMove(
    game: GameResponse,
    game_obj: AbstractGame<unknown, unknown>,
    playerNr: number,
  ): ITimeControlBase {
    const config = game.config as IConfigWithTimeControl;

    switch (config.time_control.type) {

      case TimeControlType.Absolute: {
        const timeControl: ITimeControlBase = game.time_control;
        const playerData = timeControl.forPlayer[playerNr];
        const timestamp = new Date();

        timeControl.moveTimestamps.push(timestamp);
        playerData.onThePlaySince = null;
        this._timeoutService.clearPlayerTimeout(game.id, playerNr);

        // filter out players who have not played any move yet
        const nextPlayers = game_obj.nextToPlay().filter(playerNr => game.moves.some(move => playerNr in move));
        nextPlayers.forEach((player) => {
          timeControl.forPlayer[player].onThePlaySince = timestamp;
          this._timeoutService.scheduleTimeout(game.id, player, timeControl.forPlayer[player].remainingTimeMS)
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
      case TimeControlType.Fischer: 
        const times: ITimeControlBase = game.time_control;

        if (times === undefined || times.forPlayer === undefined) {
          // old game with no moves
          return null;
        }

        const playerTime = times.forPlayer[playerNr]

        if (playerTime === undefined || playerTime.onThePlaySince === null) {
          // player has not played a move yet
          // or player is not on the play
          return null;
        }

        const timeoutTime = playerTime.onThePlaySince.getTime() + playerTime.remainingTimeMS;

        return timeoutTime - new Date().getTime()

      default: {
        console.error(`game with id ${game.id} has invalid time control type`);
        return;
      }
    }
  }
}

class TimeHandlerParallelMoves implements ITimeHandler {

  initialState(variant: string, config: IConfigWithTimeControl): ITimeControlBase {
    throw Error(
      "time control handler for parallel moves is not implemented yet",
    );
  }

  handleMove(
    _game: GameResponse,
    _game_obj: AbstractGame<unknown, unknown>,
    _playerNr: number,
    _move: string,
  ): ITimeControlBase {
    console.log(
      "time control handler for parallel moves is not implemented yet",
    );
    return;
  }

  getMsUntilTimeout(game: GameResponse, playerNr: number): number {
    throw Error(
      "time control handler for parallel moves is not implemented yet",
    );
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
