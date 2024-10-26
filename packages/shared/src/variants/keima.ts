import { Coordinate } from "../lib/coordinate";
import { Grid } from "../lib/grid";
import { getGroup } from "../lib/group_utils";
import { Variant } from "../variant";
import {
  BadukConfig,
  BadukState,
  badukVariant,
  Color,
  GridBaduk,
  groupHasLiberties,
} from "./baduk";
import { NewBadukConfig } from "./baduk_utils";

export interface KeimaState extends BadukState {
  keima?: string;
}

export class Keima extends GridBaduk {
  private move_number = 0;

  constructor(config: BadukConfig) {
    super(config);
    if (this.config.board.height < 3 && this.config.board.width < 3) {
      throw new Error("Minimum board vor Keima is 3x2");
    }
  }

  playMove(player: number, move: string): void {
    super.playMove(player, move);
    if (move === "pass") {
      if (is_keima_move_number(this.move_number)) {
        throw new Error("Can't pass during keima move");
      }
      // increment an additional time, so pass is handled like one
      // keima (i.e. two moves)
      this.move_number++;
    }
    this.increment_next_to_play();
  }

  protected postValidateMove(move: Coordinate): void {
    super.postValidateMove(move);

    if (is_keima_move_number(this.move_number)) {
      const curr = move;
      const prev = Coordinate.fromSgfRepr(this.last_move);
      if (!is_keima_shape(curr, prev)) {
        throw new Error(
          "Second move must form a Keima (Knight's move) with the first move!",
        );
      }
    } else if (
      // check if there are any legal follow-up moves
      getKeimaMoves(move, this.board).every((pos) => {
        const boardCopy = this.board.map((x) => x);
        // simulate a move
        this.playMoveInternal(pos);
        // this only checks if the follow-up move is suicidal, but it could also
        // potentially be illegal due to ko.
        const isSuicidal = !groupHasLiberties(
          getGroup(pos, this.board),
          this.board,
        );
        // reset board
        this.board = boardCopy;
        return isSuicidal;
      })
    ) {
      throw new Error("There is no legal follow-up move.");
    }
  }

  increment_next_to_play() {
    this.move_number++;
    this.next_to_play = active_player(this.move_number);
  }

  exportState(): KeimaState {
    return {
      ...super.exportState(),
      keima:
        is_keima_move_number(this.move_number) && this.last_move !== "pass"
          ? this.last_move
          : undefined,
    };
  }

  specialMoves(): { [key: string]: string } {
    return is_keima_move_number(this.move_number)
      ? { resign: "Resign" }
      : super.specialMoves();
  }
}

function active_player(n: number) {
  return n % 4 < 2 ? 0 : 1;
}

function is_keima_move_number(n: number) {
  return n % 2 === 1;
}

function is_keima_shape(a: Coordinate, b: Coordinate) {
  if (Math.abs(a.x - b.x) === 1 && Math.abs(a.y - b.y) === 2) {
    return true;
  }
  if (Math.abs(a.x - b.x) === 2 && Math.abs(a.y - b.y) === 1) {
    return true;
  }
  return false;
}

export function getKeimaMoves(
  { x, y }: Coordinate,
  board: Grid<Color>,
): Coordinate[] {
  const moves = [
    new Coordinate(x + 1, y + 2),
    new Coordinate(x - 1, y + 2),
    new Coordinate(x + 1, y - 2),
    new Coordinate(x - 1, y - 2),
    new Coordinate(x + 2, y + 1),
    new Coordinate(x - 2, y + 1),
    new Coordinate(x + 2, y - 1),
    new Coordinate(x - 2, y - 1),
  ];
  return moves
    .filter((pos) => board.isInBounds(pos))
    .filter((pos) => board.at(pos) === Color.EMPTY);
}

export const keimaVariant: Variant<NewBadukConfig> = {
  ...badukVariant,
  gameClass: Keima,
  description:
    "Baduk but players play two moves that must form a Keima (Knight's move) shape",
};
