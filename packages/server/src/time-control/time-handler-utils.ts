import {
  GameResponse,
  GenericTimeControl,
  IConfigWithTimeControl,
  IPerPlayerTimeControlBase,
  ITimeControlBase,
  TimeControl,
  makeGameObject,
  timeControlMap,
} from "@ogfcommunity/variants-shared";

export function initialState(
  variant: string,
  config: IConfigWithTimeControl,
): ITimeControlBase;
export function initialState<T extends IPerPlayerTimeControlBase>(
  variant: string,
  config: IConfigWithTimeControl,
  modifier: (per_player_base: IPerPlayerTimeControlBase) => T,
): GenericTimeControl<T>;
export function initialState(
  variant: string,
  config: IConfigWithTimeControl,
  modifier: (
    per_player_base: IPerPlayerTimeControlBase,
  ) => IPerPlayerTimeControlBase = (base) => base,
): ITimeControlBase {
  const numPlayers = makeGameObject(variant, config).numPlayers();
  const clock = timeControlMap.get(config.time_control.type);
  if (!clock) {
    throw new Error("Received config with invalid time control type");
  }

  const timeControl: ITimeControlBase = {
    moveTimestamps: [],
    forPlayer: {},
  };

  for (let i = 0; i < numPlayers; i++) {
    timeControl.forPlayer[i] = modifier({
      clockState: clock.initialState(config.time_control),
      onThePlaySince: null,
    });
  }

  return timeControl;
}

export function makeTransition<T extends IPerPlayerTimeControlBase>(
  getElapsedMS: (playerData: T) => number,
  config: IConfigWithTimeControl,
  game_id: string,
): (playerData: T) => void {
  const timeConfig = config.time_control;
  const clock = timeControlMap.get(timeConfig.type);
  if (!clock) {
    throw Error(`game with id ${game_id} has invalid time control type`);
  }
  return (playerData) => {
    const elapsedState = clock.elapse(
      getElapsedMS(playerData),
      playerData.clockState,
      timeConfig,
    );
    playerData.clockState = clock.renew(elapsedState, timeConfig);
  };
}

export function getMsUntilTimeout(
  game: GameResponse,
  playerNr: number,
  timeMS: number,
): number | null {
  const config = (game.config as IConfigWithTimeControl).time_control;

  const clock = timeControlMap.get(config.type);
  if (clock === undefined) {
    console.error(`game with id ${game.id} has invalid time control type`);
    return;
  }

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

  const elapsed = timeMS - playerTime.onThePlaySince.getTime();
  const elapsedState = clock.elapse(elapsed, playerTime.clockState, config);
  return clock.msUntilTimeout(elapsedState, config);
}

// This function is a bit of a hack to help replace instances of
// playerData.remainingTimeMS = 0
// It makes the assumption that timeControl.msUntilTimeout()
// represents a homomorphism on the clockState-space, such that
// elapsing time from a clockState is equivalent to subtracting time
// from msUntilTimeout.
// Therefore, this function returns the clockState equivalent of
// t0 - t0 = 0
export function nullTimeState(
  timeControl: TimeControl<object, object>,
  config: object,
) {
  const initialState = timeControl.initialState(config);
  const msUntilTimeout = timeControl.msUntilTimeout(initialState, config);
  return timeControl.elapse(msUntilTimeout, initialState, config);
}
