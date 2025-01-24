import {
  BoardConfig,
  BoardPattern,
  GridBoardConfig,
} from "../lib/abstractBoard/boardFactory";
import { Coordinate, CoordinateLike } from "../lib/coordinate";
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
export function mapBoard<T, S>(
  board: T[],
  f: (x: T, idx: number) => S,
  shape: "1d",
): S[];
export function mapBoard<T, S>(
  board: T[][],
  f: (x: T, idx: CoordinateLike) => S,
  shape: "2d",
): S[][];
export function mapBoard<T, S>(
  board: T[][],
  f: (x: T, idx: number) => S,
  shape: "flatten-2d-to-1d",
): S[];
export function mapBoard<T, S>(
  board: T[][],
  f: (x: T, idx: number | CoordinateLike) => S,
  shape: BoardShape,
): S[] | S[][];
export function mapBoard<T, S>(
  board: T[] | T[][],
  f: ((x: T, idx: CoordinateLike) => S) | ((x: T, idx: number) => S),
  shape: BoardShape,
) {
  switch (shape) {
    case "1d":
      return (board as T[]).map(f as (x: T, idx: number) => S);
    case "2d":
      return Grid.from2DArray(board as T[][])
        .map(f as (x: T, idx: CoordinateLike) => S)
        .to2DArray();
    case "flatten-2d-to-1d":
      return (board as T[][]).flat().map(f as (x: T, idx: number) => S);
  }
}

/**
 * Checks whether a string-encoded move is a stone placement at a certain place.
 * @param move The string-encoded move to check
 * @param idx An identifier for an intersection on the go board. If it is of type number,
 * then we assume that we work with a graph board. In case of type CoordinateLike, we assume
 * a rectangular board.
 */
export function equals_placement(
  move: string,
  idx: number | CoordinateLike,
): boolean {
  if (["", "pass", "resign", "timeout"].includes(move)) {
    return false;
  }
  if (typeof idx === "number") {
    return idx === Number(move);
  }
  return Coordinate.fromSgfRepr(move).equals(idx);
}
