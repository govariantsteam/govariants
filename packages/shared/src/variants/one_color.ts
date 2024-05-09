import { Baduk, BadukState, Color } from "./baduk";

export class OneColorGo extends Baduk {
  exportState(): BadukState {
    return {
      ...super.exportState(),
      board: this.board.map((color) =>
        Color.EMPTY === color ? Color.EMPTY : Color.WHITE,
      ),
    };
  }
}
