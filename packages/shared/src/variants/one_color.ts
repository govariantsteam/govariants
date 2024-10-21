import { Variant } from "../variant";
import { BadukState, Color, Baduk, BadukConfig, badukVariant } from "./baduk";

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

export const oneColorGoVariant: Variant<BadukConfig> = {
  ...badukVariant,
  gameClass: OneColorGo,
  description: "Baduk with obfuscated stone colors",
};
