import { getOnlyMove } from "../lib/utils";
import { Baduk, BadukMove } from "./baduk";

export class ThueMorse extends Baduk {
  private move_number = 0;

  playMove(moves: BadukMove): void {
    const { player, move } = getOnlyMove(moves);

    super.playMove(moves);

    this.increment_next_to_play();

    // Not sure if this is the best way to handle passes, but at least prevents
    // unilaterally ending the game.  If a player wishes to play only one move
    // when a string of two is available, they should play the move BEFORE passing.
    if (move === "pass") {
      while (this.next_to_play === player) {
        this.increment_next_to_play();
      }
    }
  }

  increment_next_to_play() {
    this.move_number++;
    this.next_to_play = count_binary_ones(this.move_number) % 2 ? 1 : 0;
  }
}

function count_binary_ones(n: number) {
  return n
    .toString(2)
    .split("")
    .filter((digit) => digit === "1").length;
}
