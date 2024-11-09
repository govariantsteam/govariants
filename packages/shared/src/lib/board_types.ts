import { BoardConfig } from "./abstractBoard/boardFactory";

export interface MulticolorStone {
  colors: string[];
  annotation?: "CR" | "MA";
}

/**
 * The config type in the client.
 */
export type DefaultBoardConfig = {
  board: BoardConfig;
};

export type DefaultBoardState = {
  board: MulticolorStone[] | MulticolorStone[][];
  backgroundColor: string;
};
