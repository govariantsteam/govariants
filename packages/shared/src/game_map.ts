import { Baduk } from "./variants/baduk";
import { AbstractGame } from "./abstract_game";
import { BadukWithAbstractBoard } from "./variants/badukWithAbstractBoard";
import { Phantom } from "./variants/phantom";
import { ParallelGo } from "./variants/parallel";
import { Capture } from "./variants/capture";
import { ChessGame } from "./variants/chess";
import { TetrisGo } from "./variants/tetris";

export const game_map: {
  [variant: string]: new (config?: any) => AbstractGame;
} = {
  baduk: Baduk,
  badukWithAbstractBoard: BadukWithAbstractBoard,
  phantom: Phantom,
  parallel: ParallelGo,
  capture: Capture,
  chess: ChessGame,
  tetris: TetrisGo,
};

class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export function makeGameObject(
  variant: string,
  config: unknown
): AbstractGame<unknown, unknown> {
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

export function getDefaultConfig(variant: string) {
  const game = new game_map[variant]();
  return game.defaultConfig();
}
