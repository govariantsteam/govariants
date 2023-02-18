import { Intersection } from "../abstractBoard/intersection";
import { Vector2D } from "../../variants/badukWithAbstractBoard/abstractBoard/Vector2D";

export interface AbstractBadukStone<TChainType> {
  isNew: boolean;
  possibleChainTypes(): Set<TChainType>;
}

export class BadukIntersection<
  TChainType,
  TStone extends AbstractBadukStone<TChainType>
> extends Intersection {
  stone: TStone | null;

  constructor(v: Vector2D) {
    super(v);
    this.stone = null;
  }
}
