import {
  AbstractGame,
  GameResponse,
  HasTimeControlConfig,
  IConfigWithTimeControl,
  ITimeControlBase,
  TimeControlType,
  makeGameObject,
} from "@ogfcommunity/variants-shared";
import { getTimeoutService } from "..";
import { TimeoutService } from "./timeout";
import { ITimeHandler } from "./time-control";

export class TimeHandlerSequentialMoves implements ITimeHandler {
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
          .filter(
            (player) =>
              game.moves.some((move) => player in move) || player === playerNr,
          );
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
