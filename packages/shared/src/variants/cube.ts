import { Baduk, BadukState, Color as BadukColor } from "./baduk";
import {
  BoardPattern,
  CubeBoardConfig,
} from "../lib/abstractBoard/boardFactory";
import { Variant } from "../variant";

export { BadukColor as Color };

export interface CubeBadukConfig {
  komi: number;
  board: CubeBoardConfig;
}

function defaultCubeConfig(): CubeBadukConfig {
  return {
    komi: 6.5,
    board: {
      type: BoardPattern.Cube,
      faceSize: 9, // 9x9 grid on each face
    },
  };
}

/**
 * Baduk played on the surface of a cube.
 * Each face is a grid, and edges between faces are connected.
 */
export class CubeBaduk extends Baduk {
  declare config: CubeBadukConfig;

  constructor(config: CubeBadukConfig) {
    super(config);
  }

  override getSGF(): string {
    // SGF not supported for cube boards
    return "cube-board-no-sgf";
  }
}

export const cubeBadukVariant: Variant<CubeBadukConfig, BadukState> = {
  gameClass: CubeBaduk,
  description:
    "Go played on the surface of a cube\nEach face is a grid, with edges connecting adjacent faces\nSurround stones to capture them across the 3D surface",
  time_handling: "sequential",
  defaultConfig: defaultCubeConfig,
  getPlayerColors: Baduk.getPlayerColors,
  sanitizeConfig: (config: unknown) => config as CubeBadukConfig,
  uiTransform: Baduk.uiTransform,
};
