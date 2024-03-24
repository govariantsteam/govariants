import { AbstractGame } from "../abstract_game";
import { Coordinate } from "../lib/coordinate";
import { Grid } from "../lib/grid";
import { Baduk, BadukConfig, Color } from "./baduk";

export interface QuantumGoState {
  // length=2
  // two go boards
  boards: Color[][][];
  // each element is a pair of coordinates.  The first stone is on board[0]
  // and the second stone is on board[2]
  quantum_stones: (string | null)[][];
}

interface MoveInfo {
  captures: Coordinate[];
  quantum_mapped_captures: Coordinate[];
}

/** helper class to make interactions with the Baduk instances easier */
class QuantumSubgame {
  public badukGame: Baduk;
  // only holds the "quantum" stones
  // [ this , other ]
  public quantumMappings: Coordinate[][] = [];

  constructor(config: BadukConfig) {
    this.badukGame = new Baduk(config);
  }

  play(player: number, move: string): MoveInfo {
    const subgame = this.badukGame;
    const prevBoard = copyBoard(subgame);
    subgame.playMove(player, move);
    const captures = deduceCaptures(prevBoard, subgame.board);

    const quantumMappedCaptures = captures.map(
      this.removeEntangledMapping.bind(this),
    );
    return { captures, quantum_mapped_captures: quantumMappedCaptures };
  }

  addQuantumStone(
    thisBoardPos: Coordinate,
    otherBoardPos: Coordinate,
    color: Color,
  ) {
    if (this.badukGame.board.at(thisBoardPos) !== Color.EMPTY) {
      throw new Error("There is already a stone placed here!");
    }

    this.badukGame.board.set(thisBoardPos, color);
    this.quantumMappings.push([thisBoardPos, otherBoardPos]);
  }

  clear(group: Coordinate[]) {
    for (const pos of group) {
      this.badukGame.board.set(pos, Color.EMPTY);
    }
  }

  /** Finds the entangled coordinate, and removes the Quantum mapping
   * if necessary.
   * @returns the coordinate of the entangled stone on the other board
   */
  private removeEntangledMapping(pos: Coordinate): Coordinate {
    // Quantum stones
    for (let i = 0; i < this.quantumMappings.length; i++) {
      const mapping = this.quantumMappings[i];
      if (mapping[0].equals(pos)) {
        // remove the element from the array
        this.quantumMappings.splice(i, 1);
        // return the corresponding coordinate from the other board
        return mapping[1];
      }
    }

    // Normal stones
    return pos;
  }
}

export class QuantumGo extends AbstractGame<BadukConfig, QuantumGoState> {
  subgames: QuantumSubgame[];
  first_quantum_stone?: Coordinate;

  constructor(config: BadukConfig) {
    super(config);

    this.subgames = [];
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
    // TODO: add a Dimensions class (#216) and look at that instead of
    // building a grid for no reason
    if (!new Grid(this.config.width, this.config.height).isInBounds(pos)) {
      throw "Out of bounds!";
    }

    switch (this.round) {
      case 0: {
        if (player !== 0) {
          throw new Error("Black must place the first quantum stone.");
        }
        this.first_quantum_stone = pos;
        break;
      }
      case 1: {
        if (player !== 1) {
          throw new Error("White must place the second quantum stone.");
        }
        this.subgames = [
          new QuantumSubgame(this.config),
          new QuantumSubgame(this.config),
        ];
        // We can assume this is non-null because it is filled in the first round.
        const first = this.first_quantum_stone!;
        this.subgames[0].addQuantumStone(first, pos, Color.BLACK);
        this.subgames[0].addQuantumStone(pos, first, Color.WHITE);
        this.subgames[1].addQuantumStone(pos, first, Color.BLACK);
        this.subgames[1].addQuantumStone(first, pos, Color.WHITE);
        break;
      }
      default: {
        const quantum_captures = this.subgames.map(
          (game) => game.play(player, move).quantum_mapped_captures,
        );
        this.subgames[0].clear(quantum_captures[1]);
        this.subgames[1].clear(quantum_captures[0]);
      }
    }

    super.increaseRound();
  }

  exportState(): QuantumGoState {
    if (!this.subgames.length) {
      const makeBoardWithStone = (
        pos: Coordinate | undefined,
        color: Color,
      ) => {
        const board = new Grid<Color>(
          this.config.width,
          this.config.height,
        ).fill(Color.EMPTY);
        if (pos != null) {
          board.set(pos, color);
        }
        return board.to2DArray();
      };
      const pos = this.first_quantum_stone?.toSgfRepr() ?? null;

      return {
        boards: [
          makeBoardWithStone(this.first_quantum_stone, Color.BLACK),
          makeBoardWithStone(this.first_quantum_stone, Color.WHITE),
        ],
        quantum_stones: [
          [pos, null],
          [null, pos],
        ],
      };
    }

    return {
      boards: this.subgames.map((game) => game.badukGame.board.to2DArray()),
      quantum_stones: this.subgames[0].quantumMappings.map((mapping) =>
        mapping.map((pos) => pos.toSgfRepr()),
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

/** based on two board states, determine which stones were captured */
function deduceCaptures(
  prevBoard: Grid<Color>,
  currBoard: Grid<Color>,
): Coordinate[] {
  const captures = [];
  for (let y = 0; y < prevBoard.height; y++) {
    for (let x = 0; x < prevBoard.width; x++) {
      if (
        prevBoard.at({ x, y }) !== Color.EMPTY &&
        currBoard.at({ x, y }) === Color.EMPTY
      ) {
        captures.push(new Coordinate(x, y));
      }
    }
  }
  return captures;
}

/** Make a copy of the game's board */
function copyBoard(game: Baduk): Grid<Color> {
  return game.board.map((color) => color);
}
