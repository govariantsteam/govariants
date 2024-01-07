import { type IConfigWithTimeControl } from "./time_control.types";

/**
 * Validates whether game_config has type and
 * properties for being a config with time control.
 */
export function HasTimeControlConfig(
  game_config: unknown
): game_config is IConfigWithTimeControl {
  return (
    game_config !== undefined &&
    game_config !== null &&
    typeof game_config === "object" &&
    "time_control" in game_config &&
    game_config.time_control !== null
  );
}
