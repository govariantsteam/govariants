import { Color } from "../variants/baduk";
import { Coordinate } from "./coordinate";

export class SgfRecorder {
  private sgfContent_ = "";
  public get sgfContent() {
    return this.sgfContent_;
  }

  constructor(
    variant: string,
    boardSize: { width: number; height: number },
    komi: number,
  ) {
    const { width, height } = boardSize;
    const szString = width === height ? String(width) : `${width}:${height}`;
    this.sgfContent_ += `(;\nEV[GO Variants]\nPB[Player Black]\nPW[Player White]\nSZ[${szString}]\nKM[${komi}]\nVS[${variant}]\n\n`;
  }

  public recordMove(move: Coordinate, player: Color) {
    this.sgfContent_ += `${player % 2 === 0 ? ";B" : ";W"}[${move.toSgfRepr()}]`;
  }
}
