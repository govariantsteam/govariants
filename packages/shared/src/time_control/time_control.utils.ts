import { type IConfigWithTimeControl } from "./time_control.types";

/**
 * Validates whether game_config has type and
 * properties for being a config with time control.
 */
export function HasTimeControlConfig(
  game_config: unknown,
): game_config is IConfigWithTimeControl {
  return (
    game_config !== undefined &&
    game_config !== null &&
    typeof game_config === "object" &&
    "time_control" in game_config &&
    game_config.time_control !== null
  );
}

export function msToTime(ms: number): string {
  let msCopy = ms;

  const milliseconds = ms % 1000;
  msCopy = (msCopy - milliseconds) / 1000;

  const seconds = msCopy % 60;
  msCopy = (msCopy - seconds) / 60;

  const minutes = msCopy % 60;
  msCopy = (msCopy - minutes) / 60;

  if (msCopy < 1) {
    return `${minutes.toLocaleString(undefined, {
      minimumIntegerDigits: 2,
    })}:${seconds.toLocaleString(undefined, { minimumIntegerDigits: 2 })}`;
  }

  const hours = msCopy % 24;
  msCopy = (msCopy - hours) / 24;

  if (msCopy < 1) {
    return `${hours.toLocaleString(undefined, {
      style: "unit",
      unit: "hour",
    })}`;
  }

  const days = msCopy;

  return `${days.toLocaleString(undefined, {
    style: "unit",
    unit: "day",
  })}`;
}
