import { Coordinate } from "../lib/coordinate";
import { Baduk, BadukState } from "./baduk";

export interface KeimaState extends BadukState {
  keima?: string;
}

export class Keima extends Baduk {
  private move_number = 0;

  playMove(player: number, move: string): void {
    super.playMove(player, move);
    this.increment_next_to_play();
  }

  protected postValidateMove(move: Coordinate): void {
    super.postValidateMove(move);

    if (this.last_move === "pass") {
      return;
    }

    if (is_keima_move_number(this.move_number)) {
      const curr = move;
      const prev = Coordinate.fromSgfRepr(this.last_move);
      if (!is_keima_shape(curr, prev)) {
        throw new Error(
          "Second move must form a Keima (Knight's move) with the first move!"
        );
      }
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
