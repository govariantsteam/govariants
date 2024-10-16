import { Coordinate, CoordinateLike } from "../lib/coordinate";
import { Grid } from "../lib/grid";
import { getGroup, getOuterBorder } from "../lib/group_utils";
import { SuperKoDetector } from "../lib/ko_detector";
import { AbstractGame } from "../abstract_game";
import {
  BoardPattern,
  createBoard,
  createGraph,
} from "../lib/abstractBoard/boardFactory";
import { Intersection } from "../lib/abstractBoard/intersection";
import { GraphWrapper } from "../lib/graph";
import {
  LegacyBadukConfig,
  NewBadukConfig,
  NewGridBadukConfig,
  isGridBadukConfig,
  isLegacyBadukConfig,
  mapToNewConfig,
} from "./baduk_utils";
import { Variant } from "../variant";
import { SgfRecorder } from "../lib/sgf_recorder";

export enum Color {
  EMPTY = 0,
  BLACK = 1,
  WHITE = 2,
}

export type BadukConfig = LegacyBadukConfig | NewBadukConfig;

export interface BadukState {
  board: Color[][];
  next_to_play: 0 | 1;
  captures: { 0: number; 1: number };
  last_move: string;
  score_board?: Color[][];
}

export type BadukMove = { 0: string } | { 1: string };

// Grid | GraphWrapper, so we have a better idea of serialize() return type
export declare type BadukBoard<TColor> = Grid<TColor> | GraphWrapper<TColor>;

export class Baduk extends AbstractGame<NewBadukConfig, BadukState> {
  protected captures = { 0: 0, 1: 0 };
  private ko_detector = new SuperKoDetector();
  protected score_board?: BadukBoard<Color>;
  public board: BadukBoard<Color>;
  protected next_to_play: 0 | 1 = 0;
  protected last_move = "";
  /** after game ends, this is black points - white points */
  public numeric_result?: number;
  protected sgf?: SgfRecorder;

  constructor(config: BadukConfig) {
    super(isLegacyBadukConfig(config) ? mapToNewConfig(config) : config);

    if (isGridBadukConfig(this.config)) {
      if (this.config.board.width >= 52 || this.config.board.height >= 52) {
        throw new Error("Baduk does not support sizes greater than 52");
      }

      this.board = new Grid<Color>(
        this.config.board.width,
        this.config.board.height,
      ).fill(Color.EMPTY);

      this.sgf = new SgfRecorder(this.config.board, config.komi);
    } else {
      const intersections = createBoard(this.config.board, Intersection);
      this.board = new GraphWrapper(createGraph(intersections, Color.EMPTY));
    }
  }

  override exportState(): BadukState {
    return {
      board: this.board.serialize(),
      next_to_play: this.next_to_play,
      last_move: this.last_move,
      captures: { 0: this.captures[0], 1: this.captures[1] },
      ...(this.score_board && { score_board: this.score_board.serialize() }),
    };
  }

  override nextToPlay(): number[] {
    return this.phase === "gameover" ? [] : [this.next_to_play];
  }

  private decodeMove(move: string): Coordinate {
    if (isGridBadukConfig(this.config)) {
      return Coordinate.fromSgfRepr(move);
    }
    // graph boards encode moves with the unique identifier number
    return new Coordinate(Number(move), 0);
  }

  override playMove(player: number, move: string): void {
    if (player != this.next_to_play) {
      throw Error(`It's not player ${player}'s turn!`);
    }

    this.sgf?.recordMove(move, player);

    if (move === "resign") {
      this.phase = "gameover";
      this.result = this.next_to_play === 0 ? "W+R" : "B+R";
      return;
    }

    if (move === "timeout") {
      this.phase = "gameover";
      this.result = player === 0 ? "W+T" : "B+T";
      return;
    }

    if (move != "pass") {
      const decoded_move = this.decodeMove(move);

      const { x, y } = decoded_move;
      const color = this.board.at(decoded_move);
      if (color === undefined) {
        throw Error(
          `Move out of bounds. (move: ${decoded_move}, config: ${JSON.stringify(this.config)}`,
        );
      }
      if (color !== Color.EMPTY) {
        throw Error(
          `Cannot place a stone on top of an existing stone. (${color} at (${x}, ${y}))`,
        );
      }

      this.playMoveInternal(decoded_move);
      this.postValidateMove(decoded_move);
    }
    this.prepareForNextMove(move);
    super.increaseRound();
  }

  override numPlayers(): number {
    return 2;
  }

  override specialMoves(): { [key: string]: string } {
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

  protected prepareForNextMove(move: string): void {
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
    this.numeric_result = diff;
    if (diff < 0) {
      this.result = `W+${-diff}`;
    } else if (diff > 0) {
      this.result = `B+${diff}`;
    } else {
      this.result = "Tie";
    }

    this.phase = "gameover";
  }

  override getSGF(): string {
    return this.sgf?.sgfContent ?? "non-rectangular";
  }

  static defaultConfig(): NewGridBadukConfig {
    return {
      komi: 6.5,
      board: {
        type: BoardPattern.Grid,
        width: 19,
        height: 19,
      },
    };
  }

  static getPlayerColors(_: BadukConfig, playerNr: number): string[] {
    switch (playerNr) {
      case 0:
        return ["black"];
      case 1:
        return ["white"];
      default:
        return [];
    }
  }
}

/** Returns true if the group containing (x, y) has at least one liberty. */
export function groupHasLiberties(
  group: CoordinateLike[],
  board: BadukBoard<Color>,
) {
  const outer_border = getOuterBorder(group, board);
  const border_colors = outer_border.map((pos) => board.at(pos));
  return border_colors.includes(Color.EMPTY);
}

/** Returns a reducer that will count occurences of a given number **/
function count_color<T>(value: T) {
  return (total: number, color: T) => total + (color === value ? 1 : 0);
}

export class GridBaduk extends Baduk {
  // ! isn't typesafe, but we know board will be assigned in super()
  declare board: Grid<Color>;
  protected declare score_board?: Grid<Color>;
  declare config: NewGridBadukConfig;
  constructor(config: BadukConfig) {
    if (config && !isGridBadukConfig(config)) {
      throw "GridBaduk requires a GridBadukConfig";
    }
    super(config);
  }
}

export const badukVariant: Variant<BadukConfig> = {
  gameClass: Baduk,
  description:
    "Traditional game of Baduk a.k.a. Go, Weiqi\n Surround stones to capture them\n Secure more territory + captures to win",
  defaultConfig: Baduk.defaultConfig,
  getPlayerColors: Baduk.getPlayerColors,
};
