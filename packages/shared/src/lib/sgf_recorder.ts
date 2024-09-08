import { Color } from "../variants/baduk";
import { Coordinate } from "./coordinate";

export class SgfRecorder {
  private body_: string = "";
  get sgfContent() {
    return this.makeHeader() + this.body_;
  }

  private result_?: string;

  constructor(
    public variant: string = "",
    public boardSize: { width: number; height: number } = { width: 19, height: 19 },
    public komi: number = 0,
  ) {}

  recordMove(move: string, player: Color) {
    if (move === "resign") {
      this.result_ = `${player === Color.BLACK ? "W+R" : "B+R"}`;
      return;
    }

    if (move === "timeout") {
      this.result_ = `${player === Color.BLACK ? "W+T" : "B+T"}`
      return;
    }

    if (move === "pass") {
      move = "";
    }

    this.body_ += `${player === Color.BLACK ? ";B" : ";W"}[${move}]`;
  }

  private makeHeader(): string {
    const { width, height } = this.boardSize;
    const szString = width === height ? String(width) : `${width}:${height}`;
    let header = `(;
EV[GO Variants]
PB[Player Black]
PW[Player White]
SZ[${szString}]
KM[${this.komi}]
VS[${this.variant}]\n`;
    if (this.result_ != null) {
        header += `RE[${this.result_}]\n`
    }
    header += "\n";
    return header;
  }
}
