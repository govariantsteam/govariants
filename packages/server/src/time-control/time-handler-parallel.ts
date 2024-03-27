import {
  AbstractGame,
  GameResponse,
  IConfigWithTimeControl,
  IFischerConfig,
  ITimeControlBase,
  PerPlayerTimeControlParallel,
  TimeControlParallel,
  TimeControlType,
  makeGameObject,
} from "@ogfcommunity/variants-shared";
import { ITimeoutService } from "./timeout";
import { ITimeHandler } from "./time-control";
import { IClock } from "./clock";

export class TimeHandlerParallelMoves implements ITimeHandler {
  private _timeoutService: ITimeoutService;
  private _clock: IClock;

  constructor(clock: IClock, timeoutService: ITimeoutService) {
    this._timeoutService = timeoutService;
    this._clock = clock;
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
    const timestamp = this._clock.getTimestamp();

    // could happen for old games
    // TODO: remove? maybe after db migration?
    if (game.time_control === undefined) {
      game.time_control = this.initialState(game.variant, config);
    }

    // mutates its input
    let transition: (playerTimeControl: PerPlayerTimeControlParallel) => void;

    switch (config.time_control.type) {
      case TimeControlType.Absolute: {
        transition = (playerData) => {
          playerData.remainingTimeMS -=
            playerData.stagedMoveAt.getTime() -
            playerData.onThePlaySince.getTime();
        };
        break;
      }
      case TimeControlType.Fischer: {
        const fischerConfig = config.time_control as IFischerConfig;
        transition = (playerData) => {
          const uncapped =
            playerData.remainingTimeMS +
            fischerConfig.incrementMS -
            (playerData.stagedMoveAt.getTime() -
              playerData.onThePlaySince.getTime());

          playerData.remainingTimeMS =
            fischerConfig.maxTimeMS === null
              ? uncapped
              : Math.min(uncapped, fischerConfig.maxTimeMS);
        };
        break;
      }

      case TimeControlType.Invalid:
        throw Error(`game with id ${game.id} has invalid time control type`);
    }

    return this.TransitionBase(
      game,
      game_obj,
      playerNr,
      move,
      timestamp,
      isRoundTransition,
      transition,
    );
  }

  getMsUntilTimeout(game: GameResponse, playerNr: number): number {
    const config = game.config as IConfigWithTimeControl;

    switch (config.time_control.type) {
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

        return timeoutTime - this._clock.getTimestamp().getTime();
      }

      default: {
        console.error(`game with id ${game.id} has invalid time control type`);
        return;
      }
    }
  }

  private TransitionBase(
    game: GameResponse,
    game_obj: AbstractGame<unknown, unknown>,
    playerNr: number,
    move: string,
    timestamp: Date,
    isRoundTransition: boolean,
    // mutates its input
    transition: (playerTimeControl: PerPlayerTimeControlParallel) => void,
  ): ITimeControlBase {
    const timeControl = game.time_control as TimeControlParallel;

    const playerData = timeControl.forPlayer[playerNr];

    if (move === "resign" || move === "timeout") {
      playerData.onThePlaySince = null;
      playerData.stagedMoveAt = null;
      if (move === "timeout") {
        playerData.remainingTimeMS = 0;
      }
    } else {
      playerData.stagedMoveAt = timestamp;

      // TODO: for now this should work, but I should think about this when adding
      // other time controls like Byo-Yomi and such.
      if (
        playerData.onThePlaySince !== null &&
        timeControl.forPlayer[playerNr].remainingTimeMS <=
          timestamp.getTime() - playerData.onThePlaySince.getTime()
      ) {
        throw new Error(
          "you can't change your move because it would reduce your remaining time to zero.",
        );
      }
    }

    timeControl.moveTimestamps.push(timestamp);
    this._timeoutService.clearPlayerTimeout(game.id, playerNr);

    if (isRoundTransition || game_obj.phase == "gameover") {
      for (const player of Object.keys(timeControl.forPlayer).map(Number)) {
        const playerData = timeControl.forPlayer[player];

        // time control starts only after first move of player
        if (
          playerData.onThePlaySince !== null &&
          (player === playerNr || game.moves.some((move) => player in move))
        ) {
          transition(timeControl.forPlayer[player]);
        }

        // reset
        playerData.onThePlaySince = null;
        playerData.stagedMoveAt = null;
      }

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
          this.getMsUntilTimeout(game, player),
        );
      });
    }

    return timeControl;
  }
}
