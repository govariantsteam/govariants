import { BadukState, Color, Baduk, badukVariant } from "./baduk";

export class OneColorGo extends Baduk {
  exportState(): BadukState {
    return {
      ...super.exportState(),
      board: this.board
        .map((color) => (Color.EMPTY === color ? Color.EMPTY : Color.WHITE))
        .serialize(),
    };
  }
}

export const oneColorGoVariant: typeof badukVariant = {
  ...badukVariant,
  gameClass: OneColorGo,
  description: "Baduk with obfuscated stone colors",
};
