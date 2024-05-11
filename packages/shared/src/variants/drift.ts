import { GridBoardConfig } from "../lib/abstractBoard/boardFactory";
import { Coordinate } from "../lib/coordinate";
import { Grid } from "../lib/grid";
import { getGroup } from "../lib/group_utils";
import { Baduk, Color, groupHasLiberties } from "./baduk";
import { LegacyBadukConfig, NewBadukConfig } from "./baduk_utils";

export type DriftGoConfig = { komi: number; board: GridBoardConfig } & {
  yShift: number;
  xShift: number;
};

export type LegacyDriftGoConfig = LegacyBadukConfig & {
  yShift: number;
  xShift: number;
};

function isDriftGoConfig(config: object): config is DriftGoConfig {
  return (
    "komi" in config &&
    "board" in config &&
    "xShift" in config &&
    "yShift" in config
  );
}

export class DriftGo extends Baduk {
  private typedConfig: DriftGoConfig;
  declare board: Grid<Color>;

  constructor(config?: DriftGoConfig | LegacyDriftGoConfig) {
    super(config);
    if (!isDriftGoConfig(this.config)) {
      throw Error(
        `Drift accepts only grid board config. Received config: ${JSON.stringify(config)}`,
      );
    }
    this.typedConfig = this.config ?? this.defaultConfig();
  }

  defaultConfig(): DriftGoConfig {
    return {
      komi: 6.5,
      board: { type: "grid", width: 19, height: 19 },
      xShift: 0,
      yShift: 1,
    };
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
