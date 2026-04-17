import { BadukState, Color, Baduk, badukVariant } from "./baduk";
import { ExportContext } from "../abstract_game";
import { shouldRevealHiddenInfo } from "../lib/hidden_info";

export class OneColorGo extends Baduk {
  exportState(context?: ExportContext): BadukState {
    const state = super.exportState();
    if (shouldRevealHiddenInfo(this.phase, context)) {
      return state;
    }
    return {
      ...state,
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
  movePreview: (config, state, move, _) =>
    Baduk.movePreview(config, state, move, 1),
};
