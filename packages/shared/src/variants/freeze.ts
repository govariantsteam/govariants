import { Color } from "../lib/abstractAlternatingOnGrid";
import { Coordinate, CoordinateLike } from "../lib/coordinate";
import { Grid } from "../lib/grid";
import { getGroup, getOuterBorder } from "../lib/group_utils";
import { getOnlyMove } from "../lib/utils";
import { Baduk } from "./baduk";

export class FreezeGo extends Baduk {
  private frozen = false;

  playMove(moves: { 0: string } | { 1: string }) {
    const { move, player } = getOnlyMove(moves);
    const captures_before = this.captures[player as 0 | 1];
    super.playMove(moves);
    const captures_after = this.captures[player as 0 | 1];
    if (this.frozen && captures_before !== captures_after) {
      throw new Error("Cannot capture after opponent ataris");
    }

    const opponent = player === 0 ? Color.WHITE : Color.BLACK;
    this.frozen = this.board
      .neighbors(Coordinate.fromSgfRepr(move))
      .some(
        (pos) => this.board.at(pos) === opponent && is_in_atari(pos, this.board)
      );
  }
}

function is_in_atari(pos: CoordinateLike, board: Grid<Color>) {
  const group = getGroup(pos, board);
  const num_liberties = getOuterBorder(group, board).filter(
    (pos) => board.at(pos) === Color.EMPTY
  ).length;
  return num_liberties === 1;
}
