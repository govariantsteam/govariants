import { AbstractGame, MovesType } from "../abstract_game";

export type SpaceState = "x" | "o" | undefined;

export interface TicTacToeConfig {
  size: number;
}

export interface TicTacToeState {
  grid: SpaceState[][];
  next_to_play: 0 | 1;
}

interface Coordinate {
  x: number;
  y: number;
}

// positions will be stored as two character string of digits (e.g. "01", "20"),
// so these digits can't go past 9
const MAX_SIZE = 10;

export class TicTacToe extends AbstractGame<TicTacToeConfig, TicTacToeState> {
  private grid: SpaceState[][];
  private next_to_play: 0 | 1 = 0;

  constructor(config: TicTacToeConfig) {
    if (config.size >= MAX_SIZE) {
      throw Error(`Board sizes greater than ${MAX_SIZE} not supported`);
    }
    super(config);
    this.grid = makeEmptyGrid(config.size);
  }

  exportState(): TicTacToeState {
    return { grid: this.grid, next_to_play: this.next_to_play };
  }

  nextToPlay(): number[] {
    // must be an array because with some variants, players can play moves simultaneously
    return [this.next_to_play];
  }

  playMove(moves: MovesType): void {
    const player = this.next_to_play;
    const pos_str = moves[player];

    // alternate players
    this.next_to_play = this.next_to_play === 0 ? 1 : 0;

    const pos = decodeMove(pos_str);

    if (this.grid[pos.y][pos.x] != undefined) {
      throw Error("Space already filled!");
    }

    const player_xo = player === 0 ? "x" : "o";
    this.grid[pos.y][pos.x] = player_xo;

    // check if there was a win
    const column_win = this.grid.every((row) => row[pos.x] === player_xo);
    const row_win = this.grid[pos.y].every((space) => space === player_xo);
    const diagonal_win = this.grid.every((row, idx) => row[idx] === player_xo);
    const antidiagonal_win = this.grid.every(
      (row, idx) => row[this.config.size - idx - 1] === player_xo
    );

    if (column_win || row_win || diagonal_win || antidiagonal_win) {
      this.result = `${player_xo} won!`;
      this.phase = "gameover";
      return;
    }

    // check if board was filled
    if (this.grid.every((row) => row.every((space) => space !== undefined))) {
      this.result = `Tie`;
      this.phase = "gameover";
    }
  }

  numPlayers() {
    return 2;
  }
}

function makeEmptyGrid<T>(size: number): undefined[][] {
  return new Array(size).fill(null).map(() => new Array(size).fill(undefined));
}

// Moves will be stored as two single digits representing row and column.
// This is zero indexed, so the center space in a 3x3 board is "11"
function decodeMove(move: string): Coordinate {
  return { x: Number(move[0]), y: Number(move[1]) };
}
