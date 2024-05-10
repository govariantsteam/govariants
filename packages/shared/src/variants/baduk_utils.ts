import {
  BoardConfig,
  BoardPattern,
  GridBoardConfig,
} from "../lib/abstractBoard/boardFactory";
import { CoordinateLike } from "../lib/coordinate";
import { Grid } from "../lib/grid";
import { getOuterBorder } from "../lib/group_utils";
import { BadukBoard, BadukConfig, Color } from "./baduk";

export type LegacyBadukConfig = {
  width: number;
  height: number;
  komi: number;
};

export type BadukState = {
  board: SerializedBadukBoard<Color>;
  next_to_play: 0 | 1;
  captures: { 0: number; 1: number };
  last_move: string;
  score_board?: SerializedBadukBoard<Color>;
};

/** Returns true if the group containing (x, y) has at least one liberty. */
export function groupHasLiberties(
  group: CoordinateLike[],
  board: BadukBoard<Color>,
) {
  const outer_border = getOuterBorder(group, board);
  const border_colors = outer_border.map((pos) => board.at(pos));
  return border_colors.includes(Color.EMPTY);
}

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

export declare type SerializedBadukBoard<TColor> = {
  key: { x: number; y: number };
  value: TColor;
}[];

export function serializeBadukBoard<TColor>(
  fillable: BadukBoard<TColor>,
): SerializedBadukBoard<TColor> {
  const result: SerializedBadukBoard<TColor> = [];

  fillable.forEach((value, key) =>
    result.push({ key: { x: key.x, y: key.y }, value: value }),
  );

  return result;
}

export function deserializeBadukBoard<TColor>(
  serializedBoard: SerializedBadukBoard<TColor>,
): Grid<TColor> {
  const { x: height, y: width } = serializedBoard.reduce<{
    x: number;
    y: number;
  }>(
    (previous, current) => ({
      x: Math.max(previous.x, current.key.x),
      y: Math.max(previous.y, current.key.y),
    }),
    { x: 0, y: 0 },
  );

  const result = new Grid<TColor>(width, height);
  serializedBoard.forEach((entry) => result.set(entry.key, entry.value));
  return result;
}
