import {
  AbstractAlternatingOnGrid,
  AbstractAlternatingOnGridConfig,
  AbstractAlternatingOnGridState,
  isOutOfBounds,
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
    neighboringPositions(move).forEach((pos) => {
      const neighbor_color = this.board.at(pos);
      if (isOutOfBounds(pos, this.board)) {
        return;
      }
      if (
        neighbor_color === opponent_color &&
        !groupHasLiberties(pos, this.board)
      ) {
        this.captures[this.next_to_play] += removeGroup(pos, this.board);
      }
    });
  }

  protected override postValidateMove(move: Coordinate): void {
    // Detect suicide
    if (!groupHasLiberties(move, this.board)) {
      console.log(this.board);
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
    decoded_move?: Coordinate
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

    const black_points: number = countValueIn2dArray(Color.BLACK, board);
    const white_points: number =
      countValueIn2dArray(Color.WHITE, board) + this.config.komi;

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
function groupHasLiberties(pos: CoordinateLike, board: Grid<Color>) {
  const color = board.at(pos);
  const visited = board.map(() => false);

  function helper(pos: CoordinateLike): boolean {
    const current_color = board.at(pos);
    if (current_color === undefined) {
      return false;
    }

    if (current_color === Color.EMPTY) {
      // found a liberty
      return true;
    }
    if (current_color !== color) {
      // opponent color
      return false;
    }
    if (visited.at(pos)) {
      // Already seen
      return false;
    }
    visited.set(pos, true);
    return neighboringPositions(pos).some(helper);
  }

  return helper(pos);
}

function neighboringPositions({ x, y }: CoordinateLike) {
  return [
    new Coordinate(x - 1, y),
    new Coordinate(x + 1, y),
    new Coordinate(x, y - 1),
    new Coordinate(x, y + 1),
  ] as const;
}

/**
 * Removes the group containing pos, and returns the number of stones removed
 * from the board.
 */
function removeGroup(pos: Coordinate, board: Grid<Color>): number {
  return floodFill(pos, Color.EMPTY, board);
}

/** Fills area with the given color, and returns the number of spaces filled. */
function floodFill(
  pos: CoordinateLike,
  target_color: Color,
  board: Grid<Color>
): number {
  const starting_color = board.at(pos);
  if (starting_color === target_color) {
    return 0;
  }

  function helper(pos: CoordinateLike): number {
    const current_color = board.at(pos);
    if (current_color === undefined) {
      return 0;
    }

    if (starting_color !== current_color) {
      return 0;
    }

    board.set(pos, target_color);

    return neighboringPositions(pos)
      .map(helper)
      .reduce((acc, val) => acc + val, 1);
  }

  return helper(pos);
}

/** Returns the number of occurrences for the given color */
function countValueIn2dArray<T>(value: T, array: Grid<T>) {
  // TODO: implement Grid.reduce and use it here
  return array
    .to2DArray()
    .flat()
    .filter((val) => val === value).length;
}
