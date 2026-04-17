import { Baduk, BadukState, badukVariant, Color } from "./baduk";
import { Grid } from "../lib/grid";
import { ExportContext } from "../abstract_game";

export class Phantom extends Baduk {
  exportState(context?: ExportContext): BadukState {
    const state = super.exportState();

    // Reveal the full board when:
    // - an observer is viewing a completed game (any round), OR
    // - a seated player is viewing the final state of a completed game
    //   (`this.phase === "gameover"` means the replayed object reached the
    //   end — during history review it's still "play"). This preserves the
    //   "your own perspective" replay for seated players while keeping the
    //   magical end-of-game reveal.
    const gameIsOver = context?.phase === "gameover";
    const atFinalState = this.phase === "gameover";
    const isObserver = context?.player === undefined;
    if (gameIsOver && (isObserver || atFinalState)) {
      return state;
    }

    let board = Grid.from2DArray(state.board);
    board = board.map((color) =>
      color_to_player(color) === context?.player ? color : Color.EMPTY,
    );
    state.board = board.to2DArray();
    state.last_move = "";
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

export const phantomVariant: typeof badukVariant = {
  ...badukVariant,
  gameClass: Phantom,
  description: "Baduk but other players stones are invisible",
};
