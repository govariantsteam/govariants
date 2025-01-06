import { Coordinate, CoordinateLike } from "../lib/coordinate";
import {
  BoardPattern,
  createBoard,
  createGraph,
} from "../lib/abstractBoard/boardFactory";
import {
  equals_placement,
  isGridBadukConfig,
  mapBoard,
  NewBadukConfig,
} from "./baduk_utils";
import { AbstractGame } from "../abstract_game";
import { Baduk, BadukBoard } from "./baduk";
import { Intersection } from "../lib/abstractBoard/intersection";
import { GraphWrapper } from "../lib/graph";
import { Grid } from "../lib/grid";
import { Variant } from "../variant";
import { SuperKoDetector } from "../lib/ko_detector";
import { sfractionalRulesDescription } from "../templates/sfractional_rules";
import {
  DefaultBoardConfig,
  DefaultBoardState,
  MulticolorStone,
} from "../lib/board_types";
import { examineGroup } from "../lib/group_utils";

declare type Color = string;
declare type PlacementColors = Color[] & ([Color, Color] | []);

export type SFractionalConfig = NewBadukConfig & { secondary_colors: Color[] };

export type SFractionalState = {
  board: PlacementColors[][];
  lastMove: string;
  score_board?: Color[][];
};

export class SFractional extends AbstractGame<
  SFractionalConfig,
  SFractionalState
> {
  protected last_move = "";
  public board: BadukBoard<PlacementColors>;
  public scoreBoard?: BadukBoard<Color>;
  private ko_detector = new SuperKoDetector();

  constructor(config: SFractionalConfig) {
    super(config);

    if (this.config.board.type === "grid") {
      if (this.config.board.width >= 52 || this.config.board.height >= 52) {
        throw new Error(
          "Rectangular board does not support sizes greater than 52",
        );
      }

      this.board = new Grid<PlacementColors>(
        this.config.board.width,
        this.config.board.height,
      ).fill([]);
    } else {
      const intersections = createBoard(this.config.board, Intersection);
      this.board = new GraphWrapper(createGraph(intersections, []));
    }
  }

  private isOccupied(colors: PlacementColors): colors is [Color, Color] {
    return colors.length > 0;
  }

  override exportState(): SFractionalState {
    return {
      board: this.board.serialize(),
      lastMove: this.last_move,
      ...(this.scoreBoard && { score_board: this.scoreBoard.serialize() }),
    };
  }

  override nextToPlay(): number[] {
    return this.phase === "gameover" ? [] : [this.round % 2];
  }

  override playMove(player: number, move: string): void {
    if (move === "resign") {
      this.phase = "gameover";
      this.result = player === 0 ? "W+R" : "B+R";
      return;
    }

    if (move === "timeout") {
      this.phase = "gameover";
      this.result = player === 0 ? "W+T" : "B+T";
      return;
    }

    if (!this.nextToPlay().includes(player)) {
      throw Error(`It's not player ${player}'s turn.`);
    }

    if (move != "pass") {
      const decoded_move = this.decodeMove(move);

      const placementColors = this.board.at(decoded_move);
      if (placementColors === undefined) {
        throw Error(
          `Move out of bounds. (move: ${decoded_move}, config: ${JSON.stringify(this.config)}`,
        );
      }
      if (this.isOccupied(placementColors)) {
        throw Error(
          `Cannot place a stone on top of an existing stone. (${placementColors.join(", ")} at (${decoded_move.x}, ${decoded_move.y}))`,
        );
      }

      this.playMoveInternal(decoded_move);
      this.postValidateMove();
    }
    this.prepareForNextMove(move);
    super.increaseRound();
  }

  private decodeMove(move: string): Coordinate {
    if (this.config.board.type == "grid") {
      return Coordinate.fromSgfRepr(move);
    }
    // graph boards encode moves with the unique identifier number
    return new Coordinate(Number(move), 0);
  }

  private nextStoneColors(): [Color, Color] {
    return sFractionalMoveColors(this.round, this.config);
  }

  private playMoveInternal(move: Coordinate): void {
    const stoneColors = this.nextStoneColors();
    this.board.set(move, stoneColors);

    // calculate captures
    let groupsWithoutLiberties: { x: number; y: number }[][] = [];

    // check neighbours for captured groups not connected to the placed stone
    this.board.neighbors(move).forEach((pos) => {
      const neighborStoneColors = this.board.at(pos);

      if (
        neighborStoneColors === undefined ||
        !this.isOccupied(neighborStoneColors)
      ) {
        return;
      }

      for (const color of neighborStoneColors.filter(
        (color) => !stoneColors.includes(color),
      )) {
        const examResult = this.examineGroup(pos, color);
        if (examResult.liberties === 0) {
          groupsWithoutLiberties.push(examResult.members);
        }
      }
    });

    // remove neighbouring groups without liberties
    for (const coord of groupsWithoutLiberties.flat()) {
      this.board.set(coord, []);
    }
    groupsWithoutLiberties = [];

    // check placed stone for self capture, which is allowed
    for (const color of stoneColors) {
      const examResult = this.examineGroup(move, color);
      if (examResult.liberties === 0) {
        groupsWithoutLiberties.push(examResult.members);
      }
    }

    // remove self-capture groups
    for (const coord of groupsWithoutLiberties.flat()) {
      this.board.set(coord, []);
    }
  }

  private examineGroup(
    index: CoordinateLike,
    color: Color,
  ): { members: { x: number; y: number }[]; liberties: number } {
    return examineGroup({
      index: index,
      board: this.board,
      groupIdentifier: (placementColors) => placementColors.includes(color),
      libertyIdentifier: (placementColors) => placementColors.length === 0,
    });
  }

  protected postValidateMove(): void {
    // situational superko
    this.ko_detector.push({
      board: this.board,
      cyclic_move_index: this.round % (2 * this.config.secondary_colors.length),
    });
  }

  protected prepareForNextMove(move: string): void {
    if (move == "pass" && this.last_move === "pass") {
      this.finalizeScore();
    } else {
      this.last_move = move;
    }
  }

  private finalizeScore(): void {
    const scoreBoard = this.board.map((_) => "");
    const visited = this.board.map((_) => false);
    const board = this.board;

    // setup vars and functions
    let potentialOwnerColors: Color[] = ["black", "white"];
    let territoryContainer: { x: number; y: number }[] = [];
    function resetVars(): void {
      potentialOwnerColors = ["black", "white"];
      territoryContainer = [];
    }
    function territoryIdentifier(index: { x: number; y: number }): void {
      if (visited.at(index)) {
        return;
      }

      const stoneColors = board.at(index);

      if (stoneColors === undefined) {
        // should not happen
        return;
      }

      if (stoneColors.length === 0) {
        visited.set(index, true);
        territoryContainer.push(index);
        board.neighbors(index).forEach(territoryIdentifier);
      } else {
        potentialOwnerColors = potentialOwnerColors.filter((color) =>
          stoneColors.includes(color),
        );
      }
    }

    let scoreDiff = -this.config.komi;

    // identify territory over the board and calculate score
    this.board.forEach((placementColors, index) => {
      if (this.isOccupied(placementColors)) {
        // area scoring
        if (placementColors.includes("black")) {
          scoreBoard.set(index, "black");
        } else if (placementColors.includes("white")) {
          scoreBoard.set(index, "white");
        }
        return;
      }

      territoryIdentifier(index);
      if (potentialOwnerColors.length === 1) {
        const owner = potentialOwnerColors[0];
        territoryContainer.forEach((coord) => {
          scoreBoard.set(coord, owner);
          scoreDiff += owner === "black" ? 1 : -1;
        });
      }
      resetVars();
    });

    this.scoreBoard = scoreBoard;
    if (scoreDiff === 0) {
      this.result = "Tie";
    } else {
      this.result = scoreDiff > 0 ? `B+${scoreDiff}` : `W+${-scoreDiff}`;
    }
    this.phase = "gameover";
  }

  override numPlayers(): number {
    return 2;
  }

  override specialMoves(): { [key: string]: string } {
    return { pass: "Pass", resign: "Resign" };
  }

  static defaultConfig(): SFractionalConfig {
    return {
      komi: 7.5,
      board: {
        type: BoardPattern.Grid,
        width: 19,
        height: 19,
      },
      secondary_colors: ["#0000FF", "#FF0000"],
    };
  }

  static uiTransform(
    config: SFractionalConfig,
    gamestate: SFractionalState,
  ): {
    config: SFractionalConfig & DefaultBoardConfig;
    gamestate: DefaultBoardState;
  } {
    const boardShape = isGridBadukConfig(config) ? "2d" : "flatten-2d-to-1d";

    const stoneTransform = (
      colors: PlacementColors,
      idx: number | CoordinateLike,
    ): MulticolorStone => {
      return {
        colors: colors,
        ...(equals_placement(gamestate.lastMove, idx) && { annotation: "CR" }),
      };
    };
    const scoreTransform = (color: string): string[] | null =>
      color === "" ? null : [color];

    return {
      config,
      gamestate: {
        board: mapBoard(gamestate.board, stoneTransform, boardShape),
        score_board: gamestate.score_board
          ? mapBoard(gamestate.score_board, scoreTransform, boardShape)
          : undefined,
      },
    };
  }
}

/**
 * Determines the colors of a stone in variant sfractional.
 * @param round number of round when stone is or will be played.
 * @param config config of a game instance
 */
export function sFractionalMoveColors(
  round: number,
  config: SFractionalConfig,
): [Color, Color] {
  const primaryColor = round % 2 === 0 ? "black" : "white";

  const pairedRoundsIndex = Math.floor(round / 2);
  const secondaryColor =
    config.secondary_colors[pairedRoundsIndex % config.secondary_colors.length];
  return [primaryColor, secondaryColor];
}

export const sFractionalVariant: Variant<SFractionalConfig, SFractionalState> =
  {
    gameClass: SFractional,
    defaultConfig: SFractional.defaultConfig,
    description:
      "Stones have a secondary colour that also requires liberties to avoid capture.",
    rulesDescription: sfractionalRulesDescription,
    time_handling: "sequential",
    getPlayerColors: Baduk.getPlayerColors,
    uiTransform: SFractional.uiTransform,
  };
