import { Coordinate } from "../lib/coordinate";
import { Grid } from "../lib/grid";
import { getGroup } from "../lib/group_utils";
import {
  Baduk,
  BadukConfig,
  Color,
  groupHasLiberties,
  isGridBadukConfig,
} from "./baduk";

export interface DriftGoConfig extends BadukConfig {
  yShift: number;
  xShift: number;
}

export class DriftGo extends Baduk {
  private typedConfig: DriftGoConfig;

  constructor(config?: DriftGoConfig) {
    if (config && !isGridBadukConfig(config)) {
      throw Error("config for drift must be for board type grid");
    }
    super(config);
    this.typedConfig = config ?? this.defaultConfig();
  }

  defaultConfig(): DriftGoConfig {
    return { ...super.defaultConfig(), xShift: 0, yShift: 1 };
  }

  protected prepareForNextMove(move: string): void {
    // shift board
    this.board = (this.board as Grid<Color>).map((_, coord: Coordinate) => {
      const ret = this.board.at(this.shift(coord));
      if (ret === undefined) {
        throw new Error("implementation error: index out of bounds");
      }
      return ret;
    });

    // check edges for groups without liberties
    const groupsToRemove: { x: number; y: number }[][] = [];

    (this.board as Grid<Color>).forEach((color, coord) => {
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
    const grid = this.board as Grid<Color>;
    return new Coordinate(
      (coord.x - this.typedConfig.xShift) % grid.width,
      (coord.y - this.typedConfig.yShift) % grid.height,
    );
  }

  private isOnBoundary(coord: Coordinate): boolean {
    const grid = this.board as Grid<Color>;
    return (
      coord.x === 0 ||
      coord.x === grid.width - 1 ||
      coord.y === 0 ||
      coord.y === grid.height - 1
    );
  }
}
