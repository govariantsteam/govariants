export class SgfRecorder {
  private body_: string = "";
  get sgfContent() {
    return this.makeHeader() + this.body_ + "\n\n)";
  }

  private result_?: string;

  constructor(
    public boardSize: { width: number; height: number } = { width: 19, height: 19 },
    public komi: number = 0,
  ) {}

  recordMove(move: string, player: number) {
    if (move === "resign") {
      this.result_ = `${player === 0 ? "W+R" : "B+R"}`;
      return;
    }

    if (move === "timeout") {
      this.result_ = `${player === 0 ? "W+T" : "B+T"}`
      return;
    }

    if (move === "pass") {
      move = "";
    }

    this.body_ += `${player === 0 ? ";B" : ";W"}[${move}]`;
  }

  private makeHeader(): string {
    const { width, height } = this.boardSize;
    const szString = width === height ? String(width) : `${width}:${height}`;
    let header = `(;
EV[GO Variants]
PB[Player Black]
PW[Player White]
SZ[${szString}]
KM[${this.komi}]\n`;
    if (this.result_ != null) {
        header += `RE[${this.result_}]\n`
    }
    header += "\n";
    return header;
  }
}
