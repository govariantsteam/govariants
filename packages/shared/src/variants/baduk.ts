import { Coordinate, CoordinateLike } from "../lib/coordinate";
import { Grid } from "../lib/grid";
import { getGroup, getOuterBorder } from "../lib/group_utils";
import { SuperKoDetector } from "../lib/ko_detector";
import { AbstractGame } from "../abstract_game";

export enum Color {
  EMPTY = 0,
  BLACK = 1,
  WHITE = 2,
}

export interface BadukConfig {
  width: number;
  height: number;
  komi: number;
}

export interface BadukState {
  board: Color[][];
  next_to_play: 0 | 1;
  captures: { 0: number; 1: number };
  last_move: string;
  score_board?: Color[][];
}

export type BadukMove = { 0: string } | { 1: string };

export class Baduk extends AbstractGame<BadukConfig, BadukState> {
  protected captures = { 0: 0, 1: 0 };
  private ko_detector = new SuperKoDetector();
  protected score_board?: Grid<Color>;
  protected board: Grid<Color>;
  protected next_to_play: 0 | 1 = 0;
  protected last_move = "";

  constructor(config?: BadukConfig) {
    super(config);
    this.board = new Grid<Color>(this.config.width, this.config.height).fill(
      Color.EMPTY,
    );
  }

  override exportState(): BadukState {
    return {
      board: this.board.to2DArray(),
      next_to_play: this.next_to_play,
      last_move: this.last_move,
      captures: { 0: this.captures[0], 1: this.captures[1] },
      ...(this.score_board && { score_board: this.score_board.to2DArray() }),
    };
  }

  override nextToPlay(): number[] {
    return [this.next_to_play];
  }

  override playMove(player: number, move: string): void {
    if (player != this.next_to_play) {
      throw Error(`It's not player ${player}'s turn!`);
    }

    if (move === "resign") {
      this.phase = "gameover";
      this.result = this.next_to_play === 0 ? "W+R" : "B+R";
      return;
    }

    if (move != "pass") {
      const decoded_move = Coordinate.fromSgfRepr(move);
      const { x, y } = decoded_move;
      const color = this.board.at(decoded_move);
      if (color === undefined) {
        throw Error(
          `Move out of bounds. (move: ${decoded_move}, board dimensions: ${this.config.width}x${this.config.height}`,
        );
      }
      if (color !== Color.EMPTY) {
        throw Error(
          `Cannot place a stone on top of an existing stone. (${color} at (${x}, ${y}))`,
        );
      }

      this.playMoveInternal(decoded_move);
      this.postValidateMove(decoded_move);
      this.prepareForNextMove(move);
    } else {
      this.prepareForNextMove(move);
    }
  }

  override numPlayers(): number {
    return 2;
  }

  override specialMoves() {
    return { pass: "Pass", resign: "Resign" };
  }

  private playMoveInternal(move: Coordinate): void {
    this.board.set(move, this.next_to_play === 0 ? Color.BLACK : Color.WHITE);

    const opponent_color = this.next_to_play === 0 ? Color.WHITE : Color.BLACK;
    this.board.neighbors(move).forEach((pos) => {
      const neighbor_color = this.board.at(pos);
      const group = getGroup(pos, this.board);
      if (
        neighbor_color === opponent_color &&
        !groupHasLiberties(group, this.board)
      ) {
        group.forEach((pos) => this.board.set(pos, Color.EMPTY));
        this.captures[this.next_to_play] += group.length;
      }
    });
  }

  protected postValidateMove(move: Coordinate): void {
    // Detect suicide
    if (!groupHasLiberties(getGroup(move, this.board), this.board)) {
      throw Error("Move is suicidal!");
    }

    // situational superko
    this.ko_detector.push({
      board: this.board,
      next_to_play: this.next_to_play,
    });
  }

  private prepareForNextMove(move: string): void {
    if (move == "pass" && this.last_move === "pass") {
      this.finalizeScore();
    } else {
      this.next_to_play = this.next_to_play === 0 ? 1 : 0;
      this.last_move = move;
    }
  }

  private finalizeScore(): void {
    const board = this.board.map((x) => x);
    const visited = this.board.map(() => false);

    board.forEach((color, pos) => {
      if (visited.at(pos)) {
        return;
      }
      if (color === Color.EMPTY) {
        const group = getGroup(pos, board);
        const outer_border = getOuterBorder(group, board);
        const border_colors = outer_border.map((pos) => board.at(pos) as Color);
        const color = border_colors[0];
        if (border_colors.every((c) => c === color)) {
          group.forEach((pos) => board.set(pos, color));
        }
        group.forEach((pos) => visited.set(pos, true));
      }
    });

    this.score_board = board;

    const black_points: number = board.reduce(
      count_color<Color>(Color.BLACK),
      0,
    );
    const white_points: number =
      board.reduce(count_color<Color>(Color.WHITE), 0) + this.config.komi;

    const diff = black_points - white_points;
    if (diff < 0) {
      this.result = `W+${-diff}`;
    } else if (diff > 0) {
      this.result = `B+${diff}`;
    } else {
      this.result = "Tie";
    }

    this.phase = "gameover";
  }

  defaultConfig(): BadukConfig {
    return { width: 19, height: 19, komi: 6.5 };
  }
}

/** Returns true if the group containing (x, y) has at least one liberty. */
function groupHasLiberties(group: CoordinateLike[], board: Grid<Color>) {
  const outer_border = getOuterBorder(group, board);
  const border_colors = outer_border.map((pos) => board.at(pos));
  return border_colors.includes(Color.EMPTY);
}

/** Returns a reducer that will count occurences of a given number **/
function count_color<T>(value: T) {
  return (total: number, color: T) => total + (color === value ? 1 : 0);
}
