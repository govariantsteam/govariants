import {
  BoardPattern,
  GridBoardConfig,
} from "../lib/abstractBoard/boardFactory";
import { BadukConfig } from "./baduk";

export type LegacyBadukConfig = {
  width: number;
  height: number;
  komi: number;
};

export type GridBadukConfig =
  | LegacyBadukConfig
  | {
      komi: number;
      board: GridBoardConfig;
    };

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
