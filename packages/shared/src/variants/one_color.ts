import { Variant } from "../variant";
import { BadukState, Color, Baduk, badukVariant } from "./baduk";
import { NewBadukConfig } from "./baduk_utils";

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

export const oneColorGoVariant: Variant<NewBadukConfig> = {
  ...badukVariant,
  gameClass: OneColorGo,
  description: "Baduk with obfuscated stone colors",
};
