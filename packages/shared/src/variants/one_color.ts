import { Baduk, BadukState } from "./baduk";
import { Color } from "../lib/abstractAlternatingOnGrid";

export class OneColorGo extends Baduk {
  exportState(): BadukState {
    return {
      ...super.exportState(),
      board: this.board
        .map((color) => (Color.EMPTY === color ? Color.EMPTY : Color.WHITE))
        .to2DArray(),
    };
  }
}
