import { Baduk, BadukState, Color } from "./baduk";
import { Grid } from "../lib/grid";

export class Phantom extends Baduk {
  exportState(player?: number): BadukState {
    const state = super.exportState();

    if (player === undefined) {
      return state;
    }

    state.board = state.board.map((color) =>
      color_to_player(color) === player ? color : Color.EMPTY,
    );
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
