import { Variant } from "../variant";
import { BadukState, Color, Baduk, BadukConfig } from "./baduk";

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
  gameClass: OneColorGo,
  description: "Baduk with obfuscated stone colors",
  defaultConfig: Baduk.defaultConfig,
};
