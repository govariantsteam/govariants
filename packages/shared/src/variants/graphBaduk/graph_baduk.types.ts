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
  color: Set<TColor>;

  constructor(color: TColor, isNew = true) {
    this.isNew = isNew;
    this.color = new Set<TColor>([color]);
  }

  getChainTypes(): Set<TColor> {
    return this.color;
  }
}

export type GraphBadukState = {
  komi: number;
  round: number;
  board: (BinaryColor | null)[];
  captures: {
    0: number;
    1: number;
  };
};

export type GraphBadukIntersection = BadukIntersection<
  BinaryColor,
  BadukStone<BinaryColor>
>;

export type GraphBadukKoState = {
  board: (BinaryColor | null)[];
  nextToPlay: number | undefined;
};
