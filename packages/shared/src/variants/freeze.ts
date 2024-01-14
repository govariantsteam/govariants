import { Coordinate, CoordinateLike } from "../lib/coordinate";
import { Grid } from "../lib/grid";
import { getGroup, getOuterBorder } from "../lib/group_utils";
import { Baduk, BadukState, Color } from "./baduk";

export interface FreezeGoState extends BadukState {
  frozen: boolean;
}

export class FreezeGo extends Baduk {
  private frozen = false;

  playMove(player: number, move: string) {
    const captures_before = this.captures[player as 0 | 1];
    super.playMove(player, move);
    const captures_after = this.captures[player as 0 | 1];

    if (this.frozen && captures_before !== captures_after) {
      throw new Error("Cannot capture after opponent ataris");
    }

    const opponent = player === 0 ? Color.WHITE : Color.BLACK;
    this.frozen = this.board
      .neighbors(Coordinate.fromSgfRepr(move))
      .some(
        (pos) =>
          this.board.at(pos) === opponent && is_in_atari(pos, this.board),
      );
  }

  override exportState(): FreezeGoState {
    return { ...super.exportState(), frozen: this.frozen };
  }
}

function is_in_atari(pos: CoordinateLike, board: Grid<Color>) {
  const group = getGroup(pos, board);
  const num_liberties = getOuterBorder(group, board).filter(
    (pos) => board.at(pos) === Color.EMPTY,
  ).length;
  return num_liberties === 1;
}
