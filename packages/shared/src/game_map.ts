import { Baduk } from "./baduk";
import { AbstractGame } from "./abstract_game";

// Is there any way we can get away from `any` here?
// I think only the infra needs to touch these functions, but still!
export const game_map: { [variant: string]: any } = {
  baduk: Baduk,
};

class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export function makeGameObject(
  variant: string,
  config: any
): AbstractGame<any, any> {
  try {
    return new game_map[variant](config);
  } catch (e) {
    throw new ConfigError(
      `${e}, (variant: ${variant}, config: ${JSON.stringify(config)})`
    );
  }
}

export function getVariantList(): string[] {
  return Object.keys(game_map);
}