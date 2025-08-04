import { Coordinate, CoordinateLike } from "../lib/coordinate";
import { Grid } from "../lib/grid";
import { getGroup, getOuterBorder } from "../lib/group_utils";
import { KoDetector, SuperKoDetector } from "../lib/ko_detector";
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
  equals_placement,
  isGridBadukConfig,
  isLegacyBadukConfig,
  mapBoard,
  mapToNewConfig,
} from "./baduk_utils";
import { Variant } from "../variant";
import { SgfRecorder } from "../lib/sgf_recorder";
import { DefaultBoardState, MulticolorStone } from "../lib/board_types";

export enum Color {
  EMPTY = 0,
  BLACK = 1,
  WHITE = 2,
}

export type BadukConfig = LegacyBadukConfig | NewBadukConfig;

/**
 * Type representing the state of a Baduk game at one round. Contains all information used for displaying the (board-) state client side.
 * @property board 2d-array containing the states (colors) of all board fields.
 * @property next_to_play indicates which player can play a move next.
 * @property captures maps index of a player to the number of their captures.
 * @property last_move string encoding of the move played last round
 * @property score_board 2d-array which (after scoring) indicates the area ownership
 */
export interface BadukState {
  board: Color[][];
  next_to_play: 0 | 1;
  captures: { 0: number; 1: number };
  last_move: string;
  score_board?: Color[][];
}

/**
 * Type representing a move in Baduk. The index (0 | 1) indicates the player, the string encodes what move was played.
 */
export type BadukMove = { 0: string } | { 1: string };

// This is basically Fillable<CoordinateLike, TColor> with the additional method serialize.
/**
 * Type representing a Baduk board that supports both grid and graph boards. See Fillable interface for methods.
 */
export declare type BadukBoard<TColor> = Grid<TColor> | GraphWrapper<TColor>;

/**
 * Implements rules of Baduk/Go/Weiqi. Can be used as a base class for derived variants. Uses area scoring and positional super ko. Supports graph boards. For variants that don't support graph boards, GridBaduk is more convenient.
 */
export class Baduk extends AbstractGame<NewBadukConfig, BadukState> {
  protected captures = { 0: 0, 1: 0 };
  private ko_detector: KoDetector;
  protected score_board?: BadukBoard<Color>;
  public board: BadukBoard<Color>;
  protected next_to_play: 0 | 1 = 0;
  protected last_move = "";
  /** after game ends, this is black points - white points */
  public numeric_result?: number;
  protected sgf?: SgfRecorder;

  constructor(config: BadukConfig) {
    super(Baduk.sanitizeConfig(config));

    this.ko_detector = this.instantiateKoDetector();

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

  /**
   * Decodes the string encoding of a move. Throws if move string does not represent a board field.
   * @returns Coordinate representing a board field. In case of graph boards: (x,0) where x is a unique identifier of the field.
   */
  protected decodeMove(move: string): Coordinate {
    if (isGridBadukConfig(this.config)) {
      return Coordinate.fromSgfRepr(move);
    }
    // graph boards encode moves with a unique index
    return new Coordinate(Number(move), 0);
  }

  override playMove(player: number, move: string): void {
    if (player !== this.next_to_play) {
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

    if (move !== "pass") {
      const decoded_move = this.decodeMove(move);

      const { x, y } = decoded_move;
      const color = this.board.at(decoded_move);
      if (color === undefined) {
        throw Error(
          `Move out of bounds. (move: ${decoded_move}, config: ${JSON.stringify(
            this.config,
          )}`,
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

  /**
   * Places a stone at the board and resolves captures.
   * Mutates only the internal board property (important for
   * some inheriting classes e.g. keima)
   */
  protected playMoveInternal(move: Coordinate): void {
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

  /**
   * Called after placing stone and resolving captures. Validates if move is allowed by checking if it results in self-capture or a previously seen position. Is expected to throw on an invalid move when overridden.
   */
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
    if (move === "pass" && this.last_move === "pass") {
      this.finalizeScore();
    } else {
      this.next_to_play = this.next_to_play === 0 ? 1 : 0;
      this.last_move = move;
    }
  }

  /**
   * Determines score using area scoring with the assumption that all stones are alive.
   */
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

  /**
   * Override this to change the Ko detection method.
   * @returns a Super Ko detector used for post move validation
   */
  protected instantiateKoDetector(): KoDetector {
    return new SuperKoDetector();
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

  static sanitizeConfig(config: unknown): NewBadukConfig {
    const badukConfig = config as BadukConfig;
    return isLegacyBadukConfig(badukConfig)
      ? mapToNewConfig(badukConfig)
      : badukConfig;
  }

  static uiTransform<ConfigT extends NewBadukConfig = NewBadukConfig>(
    config: ConfigT,
    gamestate: BadukState,
  ): { config: ConfigT; gamestate: DefaultBoardState } {
    const boardShape = isGridBadukConfig(config) ? "2d" : "flatten-2d-to-1d";
    const colorTransform = (color: Color): string[] => {
      switch (color) {
        case Color.BLACK:
          return ["black"];
        case Color.WHITE:
          return ["white"];
        case Color.EMPTY:
          return [];
      }
    };
    const stoneTransform = (
      color: Color,
      idx: number | CoordinateLike,
    ): MulticolorStone => {
      return {
        colors: colorTransform(color),
        ...(equals_placement(gamestate.last_move, idx) && { annotation: "CR" }),
      };
    };

    return {
      config,
      gamestate: {
        board: mapBoard(gamestate.board, stoneTransform, boardShape),
        score_board: gamestate.score_board
          ? mapBoard(gamestate.score_board, colorTransform, boardShape)
          : undefined,
      },
    };
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

/**
 * Like class Baduk but restricted to grid boards.
 */
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

export const badukVariant: Variant<NewBadukConfig, BadukState> = {
  gameClass: Baduk,
  description:
    "Traditional game of Baduk a.k.a. Go, Weiqi\n Surround stones to capture them\n Secure more territory + captures to win",
  time_handling: "sequential",
  defaultConfig: Baduk.defaultConfig,
  getPlayerColors: Baduk.getPlayerColors,
  sanitizeConfig: Baduk.sanitizeConfig,
  uiTransform: Baduk.uiTransform,
};

export const gridBadukVariant = badukVariant as Variant<
  NewGridBadukConfig,
  BadukState
>;
