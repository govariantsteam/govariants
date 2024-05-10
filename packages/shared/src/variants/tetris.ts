import { Baduk, BadukBoard, Color } from "./baduk";
import { Coordinate, CoordinateLike } from "../lib/coordinate";

export class TetrisGo extends Baduk {
  protected postValidateMove(move: Coordinate): void {
    super.postValidateMove(move);

    if (getGroup(move, this.board).length === 4) {
      throw new Error("Cannot make a group with four stones");
    }
  }
}

function getGroup(pos: CoordinateLike, board: BadukBoard<Color>) {
  const starting_color = board.at(pos);
  const visited = board.map(() => false);
  const group: Coordinate[] = [];

  function helper(pos: CoordinateLike): void {
    if (visited.at(pos)) {
      return;
    }
    visited.set(pos, true);
    const color = board.at(pos);
    if (color === starting_color) {
      group.push(new Coordinate(pos.x, pos.y));
      helper({ x: pos.x - 1, y: pos.y });
      helper({ x: pos.x + 1, y: pos.y });
      helper({ x: pos.x, y: pos.y + 1 });
      helper({ x: pos.x, y: pos.y - 1 });
    }
  }

  helper(pos);

  return group;
}
