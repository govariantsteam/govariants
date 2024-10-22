import {
  BoardConfig,
  BoardPattern,
  GridBoardConfig,
} from "../lib/abstractBoard/boardFactory";
import { BadukConfig } from "./baduk";

export type LegacyBadukConfig = {
  width: number;
  height: number;
  komi: number;
};

export type NewBadukConfig = {
  komi: number;
  board: BoardConfig;
};

export type NewGridBadukConfig = {
  komi: number;
  board: GridBoardConfig;
};

export type GridBadukConfig = LegacyBadukConfig | NewGridBadukConfig;

export function isGridBadukConfig(
  config: BadukConfig,
): config is GridBadukConfig {
  return !("board" in config) || config.board.type === BoardPattern.Grid;
}

export function getWidthAndHeight(config: GridBadukConfig): {
  width: number;
  height: number;
} {
  const width = "board" in config ? config.board.width : config.width;
  const height = "board" in config ? config.board.height : config.height;
  return { width: width, height: height };
}

export function isLegacyBadukConfig(
  config: object | undefined,
): config is LegacyBadukConfig {
  return (
    config !== undefined &&
    "width" in config &&
    "height" in config &&
    "komi" in config
  );
}

export function mapToNewConfig<ConfigT extends LegacyBadukConfig>(
  config: LegacyBadukConfig,
): ConfigT & NewGridBadukConfig {
  return {
    ...config,
    board: {
      type: BoardPattern.Grid,
      width: config.width,
      height: config.height,
    },
  } as ConfigT & NewGridBadukConfig;
  // Generally `as` is not great in TypeScript, but I believe it's true that
  // the output of this function will be the intersection of ConfigT and NewGridBadukConfig
}
