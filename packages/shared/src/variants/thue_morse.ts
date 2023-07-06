import { getOnlyMove } from "../lib/utils";
import { Baduk, BadukMove } from "./baduk";

export class ThueMorse extends Baduk {
  private move_number = 0;

  playMove(moves: BadukMove): void {
    const { player, move } = getOnlyMove(moves);

    super.playMove(moves);

    // Not sure if this is the best way to handle passes, but at least prevents
    // unilaterally ending the game.
    if (move === "pass") {
      this.next_to_play = player === 0 ? 1 : 0;
    } else {
      this.move_number++;
      this.next_to_play = count_binary_ones(this.move_number) % 2 ? 1 : 0;
    }
  }
}

function count_binary_ones(n: number) {
  return n
    .toString(2)
    .split("")
    .filter((digit) => digit === "1").length;
}
