import {
  AbstractBadukStone,
  BadukIntersection,
} from "../../lib/abstractBaduk/badukIntersection";
import { BoardConfig } from "../../lib/abstractBoard/boardFactory";

export type GraphBadukConfig = {
  board: BoardConfig;
  komi: number;
};

export type BinaryColor = "black" | "white";

export class BadukStone<TColor> implements AbstractBadukStone<TColor> {
  isNew: boolean;
  color: TColor;

  constructor(color: TColor, isNew = true) {
    this.isNew = isNew;
    this.color = color;
  }

  getChainTypes(): Set<TColor> {
    return new Set<TColor>([this.color]);
  }
}

export type GraphBadukState = {
  moves: string[];
};

export type GraphBadukIntersection = BadukIntersection<
  BinaryColor,
  BadukStone<BinaryColor>
>;
