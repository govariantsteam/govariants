import { Color } from "../variants/baduk";
import { Coordinate } from "./coordinate";

export class SgfRecorder {
  private body_: string = "";
  get sgfContent() {
    return this.makeHeader() + this.body_;
  }

  constructor(
    public variant: string = "",
    public boardSize: { width: number; height: number } = { width: 19, height: 19 },
    public komi: number = 0,
  ) {}

  recordMove(move: Coordinate, player: Color) {
    this.body_ += `${player % 2 === 0 ? ";B" : ";W"}[${move.toSgfRepr()}]`;
  }

  private makeHeader(): string {
    const { width, height } = this.boardSize;
    const szString = width === height ? String(width) : `${width}:${height}`;
    return `(;
EV[GO Variants]
PB[Player Black]
PW[Player White]
SZ[${szString}]
KM[${this.komi}]
VS[${this.variant}]\n\n`;
  }
}
