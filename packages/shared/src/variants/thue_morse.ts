import { Baduk, BadukMove } from "./baduk";

export class ThueMorse extends Baduk {
  private move_number = 0;

  playMove(moves: BadukMove): void {
    super.playMove(moves);

    this.move_number++;
    console.log(this.move_number, count_binary_ones(this.move_number));
    this.next_to_play = count_binary_ones(this.move_number) % 2 ? 1 : 0;
  }
}

function count_binary_ones(n: number) {
  return n
    .toString(2)
    .split("")
    .filter((digit) => digit === "1").length;
}
