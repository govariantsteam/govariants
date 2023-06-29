import { AbstractGame, MovesType } from "../abstract_game";
import { Chess } from "chess.js";
import { getOnlyMove } from "../lib/utils";

export interface ChessState {
  fen: string;
}

export class ChessGame extends AbstractGame<object, ChessState> {
  // third-party chess object
  private chess = new Chess();

  playMove(moves: MovesType): void {
    const { move, player } = getOnlyMove(moves);
    if (player === 1 && "b" != this.chess.turn()) {
      throw Error("Not Black's turn");
    }
    if (player === 0 && "w" != this.chess.turn()) {
      throw Error("Not White's turn");
    }
    this.chess.move(move);
  }

  exportState(): ChessState {
    return { fen: this.chess.fen() };
  }
  nextToPlay(): number[] {
    return [this.chess.turn() == "b" ? 1 : 0];
  }
  numPlayers(): number {
    return 2;
  }
  defaultConfig(): object {
    return {};
  }
}
