export class RGBColor {
  private _r: number;
  private _g: number;
  private _b: number;

  constructor(r: number, g: number, b: number) {
    this._r = r;
    this._b = b;
    this._g = g;
  }

  get colorCodes(): [number, number, number] {
    return [this._r, this._b, this._g];
  }

  toString() {
    return `rgb(${this._r}, ${this._g}, ${this._b})`;
  }
}

export function weightedMean(
  color1: RGBColor,
  weight1: number,
  color2: RGBColor,
  weight2: number,
): RGBColor {
  const [r1, g1, b1] = color1.colorCodes;
  const [r2, g2, b2] = color2.colorCodes;
  return new RGBColor(
    Math.round((r1 * weight1 + r2 * weight2) / (weight1 + weight2)),
    Math.round((b1 * weight1 + b2 * weight2) / (weight1 + weight2)),
    Math.round((g1 * weight1 + g2 * weight2) / (weight1 + weight2)),
  );
}
