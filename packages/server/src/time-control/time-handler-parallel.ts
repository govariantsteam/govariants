import {
  AbstractGame,
  GameResponse,
  IConfigWithTimeControl,
  ITimeControlBase,
  PerPlayerTimeControlParallel,
  TimeControlParallel,
  timeControlMap,
} from "@ogfcommunity/variants-shared";
import { ITimeoutService } from "./timeout";
import { ITimeHandler } from "./time-control";
import { IClock } from "./clock";
import {
  getMsUntilTimeout,
  initialState,
  makeTransition,
  nullTimeState,
} from "./time-handler-utils";

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
    return initialState(variant, config, (perPlayerBase) => ({
      ...perPlayerBase,
      stagedMoveAt: null,
    }));
  }

  handleMove(
    game: GameResponse,
    game_obj: AbstractGame,
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
    const transition = makeTransition<PerPlayerTimeControlParallel>(
      (playerData) =>
        playerData.stagedMoveAt.getTime() - playerData.onThePlaySince.getTime(),
      config,
      game.id,
    );

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
    if (
      (game.time_control as TimeControlParallel)?.forPlayer[playerNr]
        .stagedMoveAt !== null
    ) {
      return null;
    }
    return getMsUntilTimeout(
      game,
      playerNr,
      this._clock.getTimestamp().getTime(),
    );
  }

  private TransitionBase(
    game: GameResponse,
    game_obj: AbstractGame,
    playerNr: number,
    move: string,
    timestamp: Date,
    isRoundTransition: boolean,
    // mutates its input
    transition: (playerTimeControl: PerPlayerTimeControlParallel) => void,
  ): ITimeControlBase {
    const timeControl = game.time_control as TimeControlParallel;

    const playerData = timeControl.forPlayer[playerNr];

    if (!game.config.time_control) {
      throw new Error(`Time control not found in game ${game.id}`);
    }
    const timeConfig = game.config.time_control;
    const clockController = timeControlMap.get(timeConfig.type);

    if (move === "resign" || move === "timeout") {
      playerData.onThePlaySince = null;
      playerData.stagedMoveAt = null;
      if (move === "timeout") {
        playerData.clockState = nullTimeState(clockController, timeConfig);
      }
    } else {
      playerData.stagedMoveAt = timestamp;
      const clockState = timeControl.forPlayer[playerNr].clockState;

      if (
        playerData.onThePlaySince !== null &&
        clockController.msUntilTimeout(clockState, timeConfig) <=
          timestamp.getTime() - playerData.onThePlaySince.getTime()
      ) {
        throw new Error(
          "you can't change your move because it would reduce your remaining time to zero.",
        );
      }
    }

    timeControl.moveTimestamps.push(timestamp);
    this._timeoutService.clearPlayerTimeout(game.id, playerNr);

    if (isRoundTransition || game_obj.phase === "gameover") {
      for (const player of Object.keys(timeControl.forPlayer).map(Number)) {
        const playerData = timeControl.forPlayer[player];

        // time control starts only after first move of player
        if (
          playerData.onThePlaySince !== null &&
          (player === playerNr || game.moves.some((move) => player in move)) &&
          playerData.stagedMoveAt
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
