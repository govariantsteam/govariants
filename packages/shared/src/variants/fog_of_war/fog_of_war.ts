import { AbstractGame } from "../../abstract_game";
import { Coordinate } from "../../lib/coordinate";
import { Grid } from "../../lib/grid";
import { getGroup } from "../../lib/group_utils";
import { Color, groupHasLiberties } from "../baduk";
import { NewGridBadukConfig } from "../baduk_utils";
import {
  FogOfWarField,
  binaryPlayerNr,
  VisibleField,
  FogOfWarBoard,
} from "./fog_of_war.types";

export type FogOfWarState = {
  board: VisibleField[][];
};

export class FogOfWar extends AbstractGame<NewGridBadukConfig, FogOfWarState> {
  board: FogOfWarBoard;
  protected next_to_play: 0 | 1 = 0;

  constructor(config: NewGridBadukConfig) {
    super(config);

    if (this.config.board.width >= 52 || this.config.board.height >= 52) {
      throw new Error(
        "Rectangular board does not support sizes greater than 52",
      );
    }

    this.board = FogOfWar.initializeBoardVisibility(
      config.board.width,
      config.board.height,
    );
  }

  override exportState(player?: number): FogOfWarState {
    const typedPlayerNr: binaryPlayerNr | null =
      player === 0 || player === 1 ? player : null;

    return {
      board: this.board
        .map((field) => field.exportFor(typedPlayerNr))
        .serialize(),
    };
  }

  override nextToPlay(): number[] {
    return this.phase === "gameover" ? [] : [this.next_to_play];
  }

  override numPlayers(): number {
    return 2;
  }

  override specialMoves(): { [key: string]: string } {
    return { pass: "Pass", resign: "Resign" };
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

    if (move !== "pass") {
      const position = Coordinate.fromSgfRepr(move);

      if (!this.board.isInBounds(position)) {
        throw Error(`Move out of bounds. (move: ${position})`);
      }

      if (this.board.at(position)!.color !== Color.EMPTY) {
        throw Error(
          `Cannot place a stone on top of an existing stone. (${this.board.at(position)!.color} at (${position}))`,
        );
      }

      this.playMoveInternal(position);
    }
  }

  protected playMoveInternal(move: Coordinate): void {
    this.board.addStone(this.next_to_play, move);

    const opponent_color = this.next_to_play === 0 ? Color.WHITE : Color.BLACK;
    this.board.neighbors(move).forEach((pos) => {
      const neighbor_color = this.board.at(pos)!.color;
      const group = getGroup(pos, this.board);
      // if (
      //   neighbor_color === opponent_color &&
      //   !groupHasLiberties(group, this.board) // TODO
      // ) {
      //   group.forEach((pos) => this.board.removeStone(pos));
      //   //this.captures[this.next_to_play] += group.length;
      // }
    });
  }

  static initializeBoardVisibility(
    width: number,
    height: number,
  ): FogOfWarBoard {
    const grid = new FogOfWarBoard(width, height);
    grid.forEach((_, coordinate, grid) =>
      grid.set(coordinate, new FogOfWarField()),
    );
    return grid;
  }
}
