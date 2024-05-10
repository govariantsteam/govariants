import {
  BoardPattern,
  GridBoardConfig,
} from "../lib/abstractBoard/boardFactory";
import { CoordinateLike } from "../lib/coordinate";
import { getOuterBorder } from "../lib/group_utils";
import { BadukBoard, BadukConfig, Color } from "./baduk";

export type LegacyBadukConfig = {
  width: number;
  height: number;
  komi: number;
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
