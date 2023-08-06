import {
  AbstractAlternatingOnGrid,
  AbstractAlternatingOnGridConfig,
  AbstractAlternatingOnGridState,
  Color,
} from "../lib/abstractAlternatingOnGrid";
import { Coordinate, CoordinateLike } from "../lib/coordinate";
import { Grid } from "../lib/grid";
import { getGroup, getOuterBorder } from "../lib/group_utils";
import { SuperKoDetector } from "../lib/ko_detector";

export interface BadukConfig extends AbstractAlternatingOnGridConfig {
  komi: number;
}

export interface BadukState extends AbstractAlternatingOnGridState {
  captures: { 0: number; 1: number };
  last_move: string;
  score_board?: Color[][];
}

export type BadukMove = { 0: string } | { 1: string };

export class Baduk extends AbstractAlternatingOnGrid<BadukConfig, BadukState> {
  protected captures = { 0: 0, 1: 0 };
  private ko_detector = new SuperKoDetector();
  protected score_board?: Grid<Color>;

  constructor(config?: BadukConfig) {
    super(config);
  }

  override exportState(): BadukState {
    return {
      ...super.exportState(),
      ...(this.score_board && { score_board: this.score_board.to2DArray() }),
      captures: { 0: this.captures[0], 1: this.captures[1] },
    };
  }

  protected override playMoveInternal(move: Coordinate): void {
    super.playMoveInternal(move);
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

  protected override postValidateMove(move: Coordinate): void {
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

  protected override prepareForNextMove(
    move: string,
    decoded_move?: Coordinate,
  ): void {
    if (move == "pass" && this.last_move === "pass") {
      this.finalizeScore();
    } else {
      super.prepareForNextMove(move, decoded_move);
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
