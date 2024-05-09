import { Baduk, BadukConfig, Color, isGridBadukConfig } from "./baduk";
import { Grid } from "../lib/grid";

export class PyramidGo extends Baduk {
  private weights: Grid<number>;
  constructor(config?: BadukConfig) {
    if (config && !isGridBadukConfig(config)) {
      throw Error("config for pyramid must be for board type grid");
    }
    super(config);

    // Note: config may be undefined, but this.config is
    // defined after the AbstractGame constructor is called.
    const { width, height } = this.config;

    this.weights = new Grid(width, height)
      .fill(0)
      .map((_, { x, y }) => Math.min(x + 1, y + 1, width - x, height - y));
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
    return (this.score_board as Grid<Color>)
      .map((color, index) =>
        color === c ? (this.weights.at(index) as number) : 0,
      )
      .reduce((x, y) => x + y, 0);
  }
}
