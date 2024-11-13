import { KoDetector, NoKoRuleDetector } from "../lib/ko_detector";
import { Baduk, badukVariant } from "./baduk";

export class ThueMorse extends Baduk {
  private move_number = 0;

  playMove(player: number, move: string): void {
    super.playMove(player, move);

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

  protected override instantiateKoDetector(): KoDetector {
    return new NoKoRuleDetector();
  }
}

/**
 * Returns number of 1s in binary representation.
 * Can be used to calculate the Thue-Morse sequence.
 * @param n number to process
 */
export function count_binary_ones(n: number) {
  return n
    .toString(2)
    .split("")
    .filter((digit) => digit === "1").length;
}

export const thueMorseVariant: typeof badukVariant = {
  ...badukVariant,
  gameClass: ThueMorse,
  description: "Baduk with move order according to Thue-Morse sequence",
};
