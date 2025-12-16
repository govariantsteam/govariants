import { AbstractGame } from "../abstract_game";
import { Coordinate } from "../lib/coordinate";
import { Grid } from "../lib/grid";
import { DefaultBoardConfig, DefaultBoardState } from "../lib/board_types";
import { Variant } from "../variant";

export type Mark = "X" | "O";
type Cell = Mark | null;

export interface TicTacToeConfig {
  board: {
    type: "grid";
    width: number;
    height: number;
  };
  winLength: number;
}

export interface TicTacToeState {
  board: Cell[][];
  next_to_play: 0 | 1;
  last_move?: string;
}

export class TicTacToe extends AbstractGame<TicTacToeConfig, TicTacToeState> {
  public board: Grid<Cell>;
  protected next_to_play: 0 | 1 = 0;
  protected last_move = "";

  constructor(config: TicTacToeConfig) {
    super(TicTacToe.sanitizeConfig(config));
    const { width, height } = this.config.board;

    if (width > 10 || height > 10) {
      throw new Error("Board too big; keep Tic-Tac-Toe small.");
    }

    this.board = new Grid<Cell>(width, height).fill(null);
  }

  override exportState(): TicTacToeState {
    return {
      board: this.board.to2DArray(),
      next_to_play: this.next_to_play,
      ...(this.last_move && { last_move: this.last_move }),
    };
  }

  override nextToPlay(): number[] {
    return this.phase === "gameover" ? [] : [this.next_to_play];
  }

  override playMove(player: number, move: string): void {
    if (this.phase === "gameover") {
      throw new Error("Game is already finished");
    }
    if (player !== this.next_to_play) {
      throw new Error("It is not your turn");
    }

    if (move === "resign") {
      this.phase = "gameover";
      this.result =
        player === 0 ? "O wins by resignation" : "X wins by resignation";
      return;
    }

    if (move === "timeout") {
      this.phase = "gameover";
      this.result = player === 0 ? "O wins on time" : "X wins on time";
      return;
    }

    const coord = Coordinate.fromSgfRepr(move);
    if (!this.board.isInBounds(coord)) {
      throw new Error("Move out of bounds");
    }

    if (this.board.at(coord) !== null) {
      throw new Error("Space is already occupied");
    }

    const mark: Mark = player === 0 ? "X" : "O";
    this.board.set(coord, mark);
    this.last_move = move;

    if (this.isWinningMove(coord, mark)) {
      this.phase = "gameover";
      this.result = `${mark} wins`;
      return;
    }

    if (this.isBoardFull()) {
      this.phase = "gameover";
      this.result = "Draw";
      return;
    }

    this.next_to_play = this.next_to_play === 0 ? 1 : 0;
    super.increaseRound();
  }

  override numPlayers(): number {
    return 2;
  }

  override specialMoves(): { [key: string]: string } {
    return { resign: "Resign" };
  }

  private isWinningMove(coord: Coordinate, mark: Mark): boolean {
    const directions: Array<[number, number]> = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
    ];

    return directions.some(([dx, dy]) => {
      let inARow = 1;

      inARow += this.countDirection(coord, dx, dy, mark);
      inARow += this.countDirection(coord, -dx, -dy, mark);

      return inARow >= this.config.winLength;
    });
  }

  private countDirection(
    start: Coordinate,
    dx: number,
    dy: number,
    mark: Mark,
  ): number {
    let count = 0;
    let current = new Coordinate(start.x + dx, start.y + dy);

    while (this.board.isInBounds(current) && this.board.at(current) === mark) {
      count += 1;
      current = new Coordinate(current.x + dx, current.y + dy);
    }

    return count;
  }

  private isBoardFull(): boolean {
    let filled = true;
    this.board.forEach((cell) => {
      if (cell === null) {
        filled = false;
      }
    });
    return filled;
  }

  static defaultConfig(): TicTacToeConfig {
    return {
      board: { type: "grid", width: 3, height: 3 },
      winLength: 3,
    };
  }

  static sanitizeConfig(config: unknown): TicTacToeConfig {
    const defaults = TicTacToe.defaultConfig();
    if (typeof config !== "object" || config === null) {
      return defaults;
    }

    const candidate = { ...defaults, ...(config as Partial<TicTacToeConfig>) };
    const width = Math.max(
      3,
      Math.min(10, Number(candidate.board?.width ?? 3)),
    );
    const height = Math.max(
      3,
      Math.min(10, Number(candidate.board?.height ?? 3)),
    );
    const winLength = Math.max(
      3,
      Math.min(Math.min(width, height), Number(candidate.winLength ?? 3)),
    );

    return {
      board: { type: "grid", width, height },
      winLength,
    };
  }
}

function toDefaultBoardState(
  config: TicTacToeConfig,
  state: TicTacToeState,
): { config: DefaultBoardConfig; gamestate: DefaultBoardState } {
  return {
    config: {
      board: {
        type: "grid",
        width: config.board.width,
        height: config.board.height,
      },
    },
    gamestate: {
      board: state.board.map((row) =>
        row.map((cell) => {
          if (cell === null) return null;
          return {
            colors: cell === "X" ? ["#111"] : ["#f0f0f0"],
          };
        }),
      ) as unknown as DefaultBoardState["board"],
    },
  };
}

export const ticTacToeVariant: Variant<TicTacToeConfig, TicTacToeState> = {
  gameClass: TicTacToe,
  description: "Classic Tic-Tac-Toe on a 3x3 grid.",
  rulesDescription: `Play on a 3x3 grid. X moves first. First player with \`winLength\` in a row (horizontal, vertical, or diagonal) wins. Resignation ends the game immediately. Filling the board without a line results in a draw.`,
  time_handling: "sequential",
  defaultConfig: TicTacToe.defaultConfig,
  sanitizeConfig: TicTacToe.sanitizeConfig,
  getPlayerColors: (_config, player) => (player === 0 ? ["black"] : ["white"]),
  uiTransform: toDefaultBoardState,
};
