import {
  AbstractGame,
  GameResponse,
  HasTimeControlConfig,
  IConfigWithTimeControl,
  ITimeControlBase,
  TimeControlParallel,
  TimeControlType,
  makeGameObject,
} from "@ogfcommunity/variants-shared";
import { getTimeoutService } from "..";
import { TimeoutService } from "./timeout";
import { ITimeHandler } from "./time-control";

export class TimeHandlerParallelMoves implements ITimeHandler {
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
    move: string,
    isRoundTransition: boolean,
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

        if (!(move === "resign") && !(move === "timeout")) {
          timeControl.forPlayer[playerNr].stagedMoveAt = timestamp;

          if (
            playerTimeControl.onThePlaySince !== null &&
            timeControl.forPlayer[playerNr].remainingTimeMS <=
              timestamp.getTime() - playerTimeControl.onThePlaySince.getTime()
          ) {
            throw new Error(
              "you can't change your move because it would reduce your remaining time to zero.",
            );
          }
        }

        timeControl.moveTimestamps.push(timestamp);
        this._timeoutService.clearPlayerTimeout(game.id, playerNr);

        if (isRoundTransition) {
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
