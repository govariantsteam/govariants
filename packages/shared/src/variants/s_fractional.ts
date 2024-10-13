import { Coordinate, CoordinateLike } from "../lib/coordinate";
import {
  BoardPattern,
  createBoard,
  createGraph,
} from "../lib/abstractBoard/boardFactory";
import { NewBadukConfig } from "./baduk_utils";
import { AbstractGame } from "../abstract_game";
import { BadukBoard } from "./baduk";
import { Intersection } from "../lib/abstractBoard/intersection";
import { GraphWrapper } from "../lib/graph";
import { Grid } from "../lib/grid";

declare type Color = string;
declare type PlacementColors = [Color, Color] | [];
declare type StonePlacement = [{ x: number; y: number }, [Color, Color]];
declare type ScorePlacement = [{ x: number; y: number }, Color];

export type SFractionalConfig = NewBadukConfig & { secondary_colors: Color[] };

export type SFractionalState = {
  stonePlacements: StonePlacement[];
  lastMove: string;
  scorePlacements?: ScorePlacement[];
};

export class SFractional extends AbstractGame<
  SFractionalConfig,
  SFractionalState
> {
  protected last_move = "";
  public board: BadukBoard<PlacementColors>;
  public scorePlacements?: ScorePlacement[];

  constructor(config: SFractionalConfig) {
    super(config);

    if (this.config.board.type === "grid") {
      if (this.config.board.width >= 52 || this.config.board.height >= 52) {
        throw new Error("Baduk does not support sizes greater than 52");
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
    const stonePlacements: StonePlacement[] = [];

    this.board.forEach((placementColors, index) => {
      if (this.isOccupied(placementColors)) {
        stonePlacements.push([{ x: index.x, y: index.y }, placementColors]);
      }
    });

    return {
      stonePlacements: stonePlacements,
      lastMove: this.last_move,
      ...(this.scorePlacements && { scorePlacements: this.scorePlacements }),
    };
  }

  override nextToPlay(): number[] {
    return this.phase === "gameover" ? [] : [this.round % 2];
  }

  override playMove(player: number, move: string): void {
    if (move === "resign" || move === "timeout") {
      this.phase = "gameover";
      this.result = player === 0 ? "W+R" : "B+R";
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
    const primaryColor = this.round % 2 === 0 ? "black" : "white";

    const pairedRoundsIndex = Math.floor(this.round / 2);
    const secondaryColor =
      this.config.secondary_colors[
        pairedRoundsIndex % this.config.secondary_colors.length
      ];
    return [primaryColor, secondaryColor];
  }

  private playMoveInternal(move: Coordinate): void {
    const stoneColors = this.nextStoneColors();
    this.board.set(move, stoneColors);

    // calculate captures
    let groupsWithoutLiberties: { x: number; y: number }[][] = [];

    this.board.neighbors(move).forEach((pos) => {
      const neighborStoneColors = this.board.at(pos);

      if (
        neighborStoneColors === undefined ||
        !this.isOccupied(neighborStoneColors)
      ) {
        return;
      }

      // check neighbours for captured groups not connected to the placed stone
      for (const color of neighborStoneColors.filter(
        (color) => !stoneColors.includes(color),
      )) {
        const examResult = this.examineGroup(pos, color);
        if (examResult.liberties === 0) {
          groupsWithoutLiberties.push(examResult.members);
        }
      }

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
    });
  }

  private examineGroup(
    index: CoordinateLike,
    color: Color,
  ): { members: { x: number; y: number }[]; liberties: number } {
    const members: { x: number; y: number }[] = [];
    let liberties = 0;
    const board = this.board;
    const visited = this.board.map(() => false);

    function searchHelper(index: { x: number; y: number }): void {
      if (visited.at(index)) {
        return;
      }

      const stoneColors = board.at(index);

      if (stoneColors === undefined) {
        // should not happen
        return;
      }

      visited.set(index, true);

      if (stoneColors.length === 0) {
        liberties++;
      } else if (stoneColors.includes(color)) {
        members.push(index);
        board.neighbors(index).forEach(searchHelper);
      }
    }

    searchHelper(index);
    return { members: members, liberties: liberties };
  }

  protected prepareForNextMove(move: string): void {
    if (move == "pass" && this.last_move === "pass") {
      this.finalizeScore();
    } else {
      this.last_move = move;
    }
  }

  private finalizeScore(): void {
    const scorePlacements: ScorePlacement[] = [];
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
      if (visited.at(index) || potentialOwnerColors.length === 0) {
        return;
      }

      const stoneColors = board.at(index);

      if (stoneColors === undefined) {
        // should not happen
        return;
      }

      if (stoneColors.length === 0) {
        territoryContainer.push(index);
      } else {
        potentialOwnerColors.filter((color) => stoneColors.includes(color));
      }

      visited.set(index, true);
      board.neighbors(index).forEach(territoryIdentifier);
    }

    // identify territory over the board
    this.board.forEach((placementColors, index) => {
      if (this.isOccupied(placementColors)) {
        return;
      }

      territoryIdentifier(index);
      if (potentialOwnerColors.length === 1) {
        const owner = potentialOwnerColors[0];
        territoryContainer.forEach((coord) =>
          scorePlacements.push([coord, owner]),
        );
      }
      resetVars();
    });

    this.phase = "gameover";
  }

  override numPlayers(): number {
    return 2;
  }

  override specialMoves(): { [key: string]: string } {
    return { pass: "Pass", resign: "Resign" };
  }

  defaultConfig(): SFractionalConfig {
    return {
      komi: 7.5,
      board: {
        type: BoardPattern.Grid,
        width: 19,
        height: 19,
      },
      secondary_colors: ["blue", "red"],
    };
  }
}
