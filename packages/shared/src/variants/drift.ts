import { Coordinate } from "../lib/coordinate";
import { getGroup } from "../lib/group_utils";
import { Color, GridBaduk, groupHasLiberties } from "./baduk";
import { GridBadukConfig } from "./baduk_utils";

export type DriftGoConfig = GridBadukConfig & {
  yShift: number;
  xShift: number;
};

export class DriftGo extends GridBaduk {
  private typedConfig: DriftGoConfig;

  constructor(config?: DriftGoConfig) {
    super(config);
    this.typedConfig = config ?? this.defaultConfig();
  }

  defaultConfig(): DriftGoConfig {
    return { ...super.defaultConfig(), xShift: 0, yShift: 1 };
  }

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
      (coord.x - this.typedConfig.xShift) % this.board.width,
      (coord.y - this.typedConfig.yShift) % this.board.height,
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
