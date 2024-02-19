import { AbstractGame } from "../abstract_game";
import { CoordinateLike } from "../lib/coordinate";
import { Color } from "./baduk";
import { Grid } from "../lib/grid";

export interface QuantumGoConfig {
  width: number;
  height: number;
}

export interface QuantumGoState {
  // length=2
  // two go boards
  boards: Color[][][];
  // these are the quantum entangled go stones.
  // Perhaps we need something more complex to represent which stone these are entangled to...
  quantum_stones: CoordinateLike[];
}

export class QuantumGo extends AbstractGame<object, QuantumGoState> {
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

    // TODO: implement actual move logic

    super.increaseRound();
  }

  exportState(): QuantumGoState {
    // TODO: return a real state

    // For now, let's put a quantum stone at the 3-4 (小目) point...
    const fake_boards = [
      new Grid<Color>(9, 9).fill(Color.EMPTY),
      new Grid<Color>(9, 9).fill(Color.EMPTY),
    ];
    const three_four = { x: 2, y: 3 };
    fake_boards[0].set(three_four, Color.BLACK);
    fake_boards[1].set(three_four, Color.WHITE);
    const quantum_stones = [three_four];

    return {
      boards: fake_boards.map((g) => g.to2DArray()),
      quantum_stones,
    };
  }
  nextToPlay(): number[] {
    return [this.round % 2];
  }
  numPlayers(): number {
    return 2;
  }
  defaultConfig(): object {
    return { width: 9, height: 9, komi: 7.5 };
  }
}
