import { BoardPattern } from "../lib/abstractBoard";
import { Coordinate, isSgfRepr } from "../lib/coordinate";
import { Grid } from "../lib/grid";
import { getGroup } from "../lib/group_utils";
import { drift_rules } from "../templates/drift_rules";
import { Variant } from "../variant";
import {
  Baduk,
  BadukState,
  Color,
  GridBaduk,
  groupHasLiberties,
} from "./baduk";
import { LegacyBadukConfig, NewGridBadukConfig } from "./baduk_utils";

export type LegacyDriftGoConfig = LegacyBadukConfig & {
  yShift: number;
  xShift: number;
};

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

  private shift(coord: Coordinate, reverse = false): Coordinate {
    const rev = reverse ? -1 : 1;
    return new Coordinate(
      (coord.x - rev * this.config.xShift) % this.board.width,
      (coord.y - rev * this.config.yShift) % this.board.height,
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

  static sanitizeConfig(config: object): DriftGoConfig {
    const typedConfig = config as LegacyDriftGoConfig | DriftGoConfig;
    return "board" in typedConfig
      ? typedConfig
      : {
          ...typedConfig,
          board: {
            type: BoardPattern.Grid,
            width: typedConfig.width,
            height: typedConfig.height,
          },
        };
  }

  override exportState(): BadukState {
    const state = super.exportState();
    return {
      ...state,
      last_move: isSgfRepr(state.last_move)
        ? this.shift(Coordinate.fromSgfRepr(state.last_move), true).toSgfRepr()
        : state.last_move,
    };
  }
}

export const driftVariant: Variant<DriftGoConfig, BadukState> = {
  gameClass: DriftGo,
  description: "Baduk, but the entire board drifts on every turn",
  time_handling: "sequential",
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
  sanitizeConfig: DriftGo.sanitizeConfig,
  rulesDescription: drift_rules,
};
