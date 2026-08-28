import { Coordinate, type CoordinateLike } from "./coordinate";

export interface DimensionsLike {
  width: number;
  height: number;
}

/**
 * The width and height of a rectangular board, along with the calculations
 * that depend on nothing else.
 *
 * Use this instead of a Grid when the values stored at each intersection are
 * irrelevant - creating a Dimensions does not allocate an array.
 */
export class Dimensions implements DimensionsLike {
  constructor(
    public readonly width: number,
    public readonly height: number,
  ) {
    if (width < 0) {
      throw new Error(`Invalid width: ${width}`);
    }
    if (height < 0) {
      throw new Error(`Invalid height: ${height}`);
    }
  }

  static from({ width, height }: DimensionsLike): Dimensions {
    return new Dimensions(width, height);
  }

  /** The number of intersections on the board. */
  get area(): number {
    return this.width * this.height;
  }

  isInBounds({ x, y }: CoordinateLike): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  /** @returns the in-bounds orthogonal neighbors of index, or [] if index itself
   * is out of bounds.
   */
  neighbors({ x, y }: CoordinateLike): Coordinate[] {
    if (!this.isInBounds({ x, y })) {
      // An alternative is to return edge points for some out-of-bounds inputs,
      // but our floodfill algorithms depend on an empty array here.
      return [];
    }
    return [
      new Coordinate(x, y - 1),
      new Coordinate(x, y + 1),
      new Coordinate(x - 1, y),
      new Coordinate(x + 1, y),
    ].filter((index) => this.isInBounds(index));
  }

  /** @returns the index of a coordinate in a row-major flat array. */
  toFlatIndex({ x, y }: CoordinateLike): number {
    return y * this.width + x;
  }

  /** @returns the coordinate at an index of a row-major flat array. */
  fromFlatIndex(index: number): Coordinate {
    return new Coordinate(index % this.width, Math.floor(index / this.width));
  }

  /** If a component of index is negative, count from the end of that row or
   * column, as Array.prototype.at does.
   */
  resolveNegativeIndices({ x, y }: CoordinateLike): Coordinate {
    return new Coordinate(
      x < 0 ? this.width + x : x,
      y < 0 ? this.height + y : y,
    );
  }

  /** Calls f on every coordinate of the board, in row-major order. */
  forEach(f: (index: Coordinate) => void): void {
    for (let y = 0; y < this.height; ++y) {
      for (let x = 0; x < this.width; ++x) {
        f(new Coordinate(x, y));
      }
    }
  }

  equals(other: DimensionsLike): boolean {
    return this.width === other.width && this.height === other.height;
  }
}
