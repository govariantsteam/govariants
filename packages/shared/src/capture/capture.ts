import { Baduk } from "../baduk";

export class Capture extends Baduk {
  playMove(move: { 0: string } | { 1: string }): void {
    super.playMove(move);
    if (this.captures[0]) {
      this.phase = "gameover";
      this.result = "B+Capture";
    }
    if (this.captures[1]) {
      this.phase = "gameover";
      this.result = "W+Capture";
    }
  }
}
