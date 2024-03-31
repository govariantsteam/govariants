import {
  AbstractGame,
  GameResponse,
  IConfigWithTimeControl,
  IPerPlayerTimeControlBase,
  ITimeControlBase,
  TimeControlType,
} from "@ogfcommunity/variants-shared";
import { ITimeoutService } from "./timeout";
import { ITimeHandler } from "./time-control";
import { IClock } from "./clock";
import { initialState, makeTransition } from "./time-handler-utils";

export class TimeHandlerSequentialMoves implements ITimeHandler {
  private _timeoutService: ITimeoutService;
  private _clock: IClock;

  constructor(clock: IClock, timeoutService: ITimeoutService) {
    this._timeoutService = timeoutService;
    this._clock = clock;
  }

  initialState(
    variant: string,
    config: IConfigWithTimeControl,
  ): ITimeControlBase {
    return initialState(variant, config);
  }

  handleMove(
    game: GameResponse,
    game_obj: AbstractGame<unknown, unknown>,
    playerNr: number,
    move: string,
  ): ITimeControlBase {
    const config = game.config as IConfigWithTimeControl;
    const timestamp = this._clock.getTimestamp();

    // could happen for old games
    // TODO: remove? maybe after db migration?
    if (game.time_control === undefined) {
      game.time_control = this.initialState(game.variant, config);
    }

    // mutates its input
    const transition = makeTransition(
      (playerData) => timestamp.getTime() - playerData.onThePlaySince.getTime(),
      config,
      move,
      game.id,
    );

    return this.TimeTransitionBase(
      game,
      game_obj,
      playerNr,
      move,
      timestamp,
      transition,
    );
  }

  getMsUntilTimeout(game: GameResponse, playerNr: number): number | null {
    const config = game.config as IConfigWithTimeControl;

    switch (config.time_control.type) {
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

        return timeoutTime - this._clock.getTimestamp().getTime();
      }
      default: {
        console.error(`game with id ${game.id} has invalid time control type`);
        return;
      }
    }
  }

  private TimeTransitionBase(
    game: GameResponse,
    game_obj: AbstractGame<unknown, unknown>,
    playerNr: number,
    move: string,
    timestamp: Date,
    // mutates its input
    transition: (playerTimeControl: IPerPlayerTimeControlBase) => void,
  ): ITimeControlBase {
    const timeControl = game.time_control;
    const playerData = timeControl.forPlayer[playerNr];

    timeControl.moveTimestamps.push(timestamp);

    if (playerData.onThePlaySince !== null) {
      transition(playerData);
      playerData.onThePlaySince = null;
    }
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
        this.getMsUntilTimeout(game, player),
      );
    });

    return timeControl;
  }
}
