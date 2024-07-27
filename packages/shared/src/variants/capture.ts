import { Variant } from "../variant";
import { Baduk, BadukConfig } from "./baduk";

export class Capture extends Baduk {
  playMove(player: number, move: string): void {
    super.playMove(player, move);
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

export const captureVariant: Variant<BadukConfig> = {
  gameClass: Capture,
  description: "Baduk but the first player who captures a stone wins",
};
