import { AbstractGame } from "../abstract_game";
import { Coordinate } from "../lib/coordinate";
import { Baduk, BadukConfig, Color } from "./baduk";

export interface QuantumGoState {
  // length=2
  // two go boards
  boards: Color[][][];
  // each element is a pair of coordinates.  The first stone is on board[0]
  // and the second stone is on board[2]
  quantum_stones: (string | null)[][];
}

export class QuantumGo extends AbstractGame<BadukConfig, QuantumGoState> {
  subgames: Baduk[];
  quantum_stones: (Coordinate | null)[][];

  constructor(config: BadukConfig) {
    super(config);

    this.subgames = [new Baduk(config), new Baduk(config)];
    this.quantum_stones = [];
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

    const pos = Coordinate.fromSgfRepr(move);
    if (!this.subgames[0].board.isInBounds(pos)) {
      throw "Out of bounds!";
    }

    if (this.round === 0) {
      if (player !== 0) {
        throw new Error("Black must place the second quantum stone.");
      }
      this.subgames[0].board.set(pos, Color.BLACK);
      this.subgames[1].board.set(pos, Color.WHITE);
      this.quantum_stones = [
        [pos, null],
        [null, pos],
      ];
    }

    if (this.round === 1) {
      if (player !== 1) {
        throw new Error("White must place the second quantum stone.");
      }
      if (this.subgames[0].board.at(pos) !== Color.EMPTY) {
        throw new Error("There is already a stone placed here!");
      }
      this.subgames[0].board.set(pos, Color.WHITE);
      this.subgames[1].board.set(pos, Color.BLACK);
      this.quantum_stones[0][1] = pos;
      this.quantum_stones[1][0] = pos;
    }

    // TODO: implement further game logic

    super.increaseRound();
  }

  exportState(): QuantumGoState {
    return {
      boards: this.subgames.map((subgame) => subgame.exportState().board),
      quantum_stones: this.quantum_stones.map((pair) =>
        pair.map((pos) => (pos ? pos.toSgfRepr() : null)),
      ),
    };
  }
  nextToPlay(): number[] {
    return [this.round % 2];
  }
  numPlayers(): number {
    return 2;
  }
  defaultConfig(): BadukConfig {
    return { width: 9, height: 9, komi: 7.5 };
  }
}
