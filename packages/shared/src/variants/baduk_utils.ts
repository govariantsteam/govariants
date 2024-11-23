import {
  BoardConfig,
  BoardPattern,
  GridBoardConfig,
} from "../lib/abstractBoard/boardFactory";
import { Grid } from "../lib/grid";
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
  config: ConfigT,
): ConfigT & NewGridBadukConfig {
  return {
    ...config,
    board: {
      type: BoardPattern.Grid,
      width: config.width,
      height: config.height,
    },
  };
}

export type BoardShape = "1d" | "2d" | "flatten-2d-to-1d";
export function mapBoard<T, S>(board: T[], f: (x: T) => S, shape: "1d"): S[];
export function mapBoard<T, S>(
  board: T[][],
  f: (x: T) => S,
  shape: "2d",
): S[][];
export function mapBoard<T, S>(
  board: T[][],
  f: (x: T) => S,
  shape: "flatten-2d-to-1d",
): S[];
export function mapBoard<T, S>(
  board: T[][],
  f: (x: T) => S,
  shape: BoardShape,
): S[] | S[][];
export function mapBoard<T, S>(
  board: T[] | T[][],
  f: (x: T) => S,
  shape: BoardShape,
) {
  switch (shape) {
    case "1d":
      return (board as T[]).map(f);
    case "2d":
      return Grid.from2DArray(board as T[][])
        .map(f)
        .to2DArray();
    case "flatten-2d-to-1d":
      return (board as T[][]).flat().map(f);
  }
}
