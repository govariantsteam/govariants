import { Baduk, BadukConfig, BadukState, Color } from "./baduk";
import { Grid } from "../lib/grid";
import { Variant } from "../variant";

export class Phantom extends Baduk {
  exportState(player?: number): BadukState {
    const state = super.exportState();

    if (player === undefined) {
      return state;
    }

    let board = Grid.from2DArray(state.board);
    board = board.map((color) =>
      color_to_player(color) === player ? color : Color.EMPTY,
    );
    state.board = board.to2DArray();
    return state;
  }
}

function color_to_player(color: Color) {
  switch (color) {
    case Color.BLACK:
      return 0;
    case Color.WHITE:
      return 1;
    case Color.EMPTY:
      return undefined;
  }
}

export const phantomVariant: Variant<BadukConfig> = {
  gameClass: Phantom,
  description: "Baduk but other players stones are invisible",
  defaultConfig: Baduk.defaultConfig,
  getPlayerColors: Baduk.getPlayerColors,
};
