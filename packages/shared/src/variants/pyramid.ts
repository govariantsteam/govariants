import { Baduk, BadukBoard, BadukState, badukVariant, Color } from "./baduk";
import { Grid } from "../lib/grid";
import {
  isGridBadukConfig,
  isLegacyBadukConfig,
  LegacyBadukConfig,
  NewBadukConfig,
  NewGridBadukConfig,
} from "./baduk_utils";
import { pyramidRuleDescription } from "../templates/pyramid_rules";
import { DefaultBoardState, MulticolorStone } from "../lib/board_types";
import { weightedMean, RGBColor } from "../lib/color-utils";
import { GraphWrapper } from "../lib/graph";
import {
  BoardPattern,
  createBoard,
  createGraph,
  Intersection,
} from "../lib/abstractBoard";
import { Variant } from "../variant";
import { getWidthAndHeight } from "./baduk_utils";

export type PyramidConfig = NewBadukConfig & { weights?: number[] };

export class PyramidGo extends Baduk {
  private weights?: BadukBoard<number>;

  constructor(config: PyramidConfig | LegacyBadukConfig) {
    super(config);

    // Note: config may be undefined, but this.config is
    // defined after the AbstractGame constructor is called.
    if (isLegacyBadukConfig(config) || isGridBadukConfig(config)) {
      const { width, height } = getWidthAndHeight(config);

      // If/when we support custom weights, then we should check if they are set here.

      this.weights = new Grid(width, height)
        .fill(0)
        .map((_, { x, y }) => Math.min(x + 1, y + 1, width - x, height - y));
    } else {
      if (config.weights) {
        const graph = createGraph(
          createBoard(config.board, Intersection),
          null,
        );
        this.weights = new GraphWrapper(
          graph.map((_, idx) => config.weights![idx]),
        );
      }
    }
  }

  get result(): string {
    if (this.score_board === undefined) {
      return "";
    }
    const white_points = this.pointsForColor(Color.WHITE);
    const black_points = this.pointsForColor(Color.BLACK);

    const diff = Math.abs(white_points - black_points);
    if (diff === 0) return "Tie";
    return white_points > black_points ? `W+${diff}` : `B+${diff}`;
  }
  set result(_: string) {
    // do nothing, we don't want super class to set this
  }

  private pointsForColor(c: Color) {
    if (this.score_board === undefined) return 0;
    let points = c === Color.WHITE ? this.config.komi : 0;
    this.score_board.forEach(
      (color, index) =>
        (points += color === c ? (this.weights?.at(index) ?? 1) : 0),
    );
    return points;
  }

  static defaultConfig(): NewGridBadukConfig {
    return {
      komi: 6.5,
      board: {
        type: BoardPattern.Grid,
        width: 19,
        height: 19,
      },
    };
  }
}

function pyramidUiTransform(
  config: PyramidConfig,
  gamestate: BadukState,
): { config: PyramidConfig; gamestate: DefaultBoardState } {
  const light_brown = new RGBColor(220, 179, 92);
  const dark_brown = new RGBColor(133, 62, 26);
  const badukTransformed = Baduk.uiTransform(config, gamestate);

  if (isGridBadukConfig(config)) {
    const { width, height } = getWidthAndHeight(config);
    const maxValue = 1 + Math.floor(Math.min(width, height) / 2);

    const valueOf = (x: number, y: number): number => {
      return Math.min(x + 1, y + 1, width - x, height - y);
    };

    badukTransformed.gamestate.board = (
      badukTransformed.gamestate.board as MulticolorStone[][]
    ).map((row, y) =>
      row.map((multicolorStone, x) => ({
        ...multicolorStone,
        background_color: weightedMean(
          light_brown,
          1 - valueOf(x, y) / maxValue,
          dark_brown,
          valueOf(x, y) / maxValue,
        ).toString(),
      })),
    );

    return badukTransformed;
  }

  if (!config.weights) {
    return badukTransformed;
  }

  const maxValue = Math.max(...config.weights);

  badukTransformed.gamestate.board = (
    badukTransformed.gamestate.board as MulticolorStone[]
  ).map((multicolorStone, x) => {
    return {
      ...multicolorStone,
      background_color: weightedMean(
        light_brown,
        1 - config.weights![x] / maxValue,
        dark_brown,
        config.weights![x] / maxValue,
      ).toString(),
    };
  });

  return badukTransformed;
}

export const pyramidVariant: Variant<PyramidConfig, BadukState> = {
  ...badukVariant,
  gameClass: PyramidGo,
  description:
    "Baduk with pyramid scoring\n Center is worth most points, edge the least",
  rulesDescription: pyramidRuleDescription,
  uiTransform: pyramidUiTransform,
};
