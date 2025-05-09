import { AbstractGame } from "../abstract_game";
import { Chess } from "chess.js";
import { Variant } from "../variant";

export interface ChessState {
  fen: string;
}

export class ChessGame extends AbstractGame<object, ChessState> {
  // third-party chess object
  private chess = new Chess();

  constructor(config?: object) {
    super(config ?? {});
  }

  playMove(player: number, move: string): void {
    if (move === "resign") {
      this.phase = "gameover";
      this.result = player === 0 ? "B+R" : "W+R";
      return;
    }

    if (move === "timeout") {
      this.phase = "gameover";
      this.result = player === 0 ? "B+T" : "W+T";
      return;
    }

    if (player === 1 && "b" !== this.chess.turn()) {
      throw Error("Not Black's turn");
    }
    if (player === 0 && "w" !== this.chess.turn()) {
      throw Error("Not White's turn");
    }
    this.chess.move(move);
    super.increaseRound();
  }

  exportState(): ChessState {
    return { fen: this.chess.fen() };
  }
  nextToPlay(): number[] {
    return this.phase === "gameover" ? [] : [this.chess.turn() === "b" ? 1 : 0];
  }
  numPlayers(): number {
    return 2;
  }
  defaultConfig(): object {
    return {};
  }
}

export const chessVariant: Variant = {
  gameClass: ChessGame,
  description:
    "Baduk with different types of stones\n the goal is to capture a specific stone",
  time_handling: "sequential",
  defaultConfig: Object,
};
