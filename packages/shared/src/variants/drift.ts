import { Coordinate } from "../lib/coordinate";
import { Grid } from "../lib/grid";
import { getGroup } from "../lib/group_utils";
import { Variant } from "../variant";
import { Baduk, Color, GridBaduk, gridBadukVariant, groupHasLiberties } from "./baduk";
import { NewGridBadukConfig } from "./baduk_utils";

export type DriftGoConfig = NewGridBadukConfig & {
  yShift: number;
  xShift: number;
};

export class DriftGo extends GridBaduk {
  declare config: DriftGoConfig;
  declare board: Grid<Color>;

  protected prepareForNextMove(move: string): void {
    // shift board
    this.board = this.board.map((_, coord: Coordinate) => {
      const ret = this.board.at(this.shift(coord));
      if (ret === undefined) {
        throw new Error("implementation error: index out of bounds");
      }
      return ret;
    });

    // check edges for groups without liberties
    const groupsToRemove: { x: number; y: number }[][] = [];

    this.board.forEach((color, coord) => {
      if (color === Color.EMPTY || !this.isOnBoundary(coord)) {
        return;
      }

      const group = getGroup(coord, this.board);
      if (!groupHasLiberties(group, this.board)) {
        groupsToRemove.push(group);
      }
    });

    // remove simultaneously
    for (const group of groupsToRemove) {
      group.forEach((pos) => this.board.set(pos, Color.EMPTY));
    }

    super.prepareForNextMove(move);
  }

  private shift(coord: Coordinate): Coordinate {
    return new Coordinate(
      (coord.x - this.config.xShift) % this.board.width,
      (coord.y - this.config.yShift) % this.board.height,
    );
  }

  private isOnBoundary(coord: Coordinate): boolean {
    return (
      coord.x === 0 ||
      coord.x === this.board.width - 1 ||
      coord.y === 0 ||
      coord.y === this.board.height - 1
    );
  }
}

export const driftVariant: Variant<DriftGoConfig, BadukState> = {
  gameClass: DriftGo,
  description: "Baduk, but the entire board drifts on every turn",
  defaultConfig(): DriftGoConfig {
    return {
      komi: 6.5,
      board: { type: "grid", width: 19, height: 19 },
      xShift: 0,
      yShift: 1,
    };
  },
  getPlayerColors: Baduk.getPlayerColors,
  uiTransform: Baduk.uiTransform<DriftGoConfig>,
};
