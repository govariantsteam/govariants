import { AbstractBadukStone } from "../../lib/abstractBaduk/badukIntersection";
import { Color } from "./fractional";

export class FractionalStone implements AbstractBadukStone<Color> {
  isNew: boolean;
  colors: Set<Color>;

  constructor(colors: Set<Color>, isNew = true) {
    this.isNew = isNew;
    this.colors = colors;
  }

  possibleChainTypes(): Set<Color> {
    return this.colors;
  }
}
