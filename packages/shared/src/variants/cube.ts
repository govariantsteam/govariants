import { Baduk, BadukState, Color as BadukColor } from "./baduk";
import {
  BoardPattern,
  CubeBoardConfig,
} from "../lib/abstractBoard/boardFactory";
import { Variant } from "../variant";
import { facePositionToIndex } from "../lib/abstractBoard/helper/CubeHelper";
import { Coordinate } from "../lib/coordinate";

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

  /**
   * Override to support face-x-y notation for moves.
   * Accepts moves in format "face-x-y" (e.g., "0-1-2" for face 0, position (1,2))
   * or plain index format for backwards compatibility.
   */
  override decodeMove(move: string): Coordinate {
    // Check if move is in face-x-y format
    const parts = move.split("-");
    if (parts.length === 3) {
      const face = Number(parts[0]);
      const x = Number(parts[1]);
      const y = Number(parts[2]);

      if (isNaN(face) || isNaN(x) || isNaN(y)) {
        throw new Error(
          `Invalid move format: ${move}. Expected "face-x-y" or index.`,
        );
      }

      const index = facePositionToIndex(face, x, y, this.config.board.faceSize);

      if (index === -1) {
        throw new Error(`Invalid position: face=${face}, x=${x}, y=${y}`);
      }

      return new Coordinate(index, 0);
    }

    // Fall back to parent implementation (plain index)
    return super.decodeMove(move);
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
  movePreview: Baduk.movePreview,
};
