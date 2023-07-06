import { Coordinate, CoordinateLike } from "./coordinate";

/**
 * A 2D analog to the native JavaScript array.  As much as possible,
 * the API should match that of a regular Array.
 */
export class Grid<T> {
  private arr: Array<T>;
  constructor(public readonly width: number, public readonly height: number) {
    if (width < 0) {
      throw new Error("Invalid array width");
    }

    this.arr = new Array(width * height);
  }

  at(index: CoordinateLike): T | undefined {
    const w = this.width;
    const h = this.height;

    index = handleNegativeIndices(index, w, h);

    if (!this.isInBounds(index)) {
      return undefined;
    }
    return this.arr[coordinate_to_flat_index(index, w)];
  }

  set(index: CoordinateLike, value: T): void {
    const w = this.width;
    const h = this.height;

    index = handleNegativeIndices(index, w, h);

    if (!this.isInBounds(index)) {
      return;
    }

    this.arr[coordinate_to_flat_index(index, w)] = value;
  }

  map<S>(
    callbackfn: (value: T, index: Coordinate, grid: Grid<T>) => S,
    thisArg?: any
  ): Grid<S> {
    const ret = new Grid<S>(this.width, this.height);
    ret.arr = this.arr.map(
      (value: T, flat_index: number) =>
        callbackfn(
          value,
          flat_index_to_coordinate(flat_index, this.width),
          this
        ),
      thisArg
    );
    return ret;
  }

  forEach(
    callbackfn: (value: T, index: Coordinate, grid: Grid<T>) => void,
    thisArg?: any
  ): void {
    this.arr.forEach((value: T, flat_index: number) => {
      callbackfn(value, flat_index_to_coordinate(flat_index, this.width), this);
    }, thisArg);
  }

  static from2DArray<T>(array: T[][]) {
    const height = array.length;

    if (!height) {
      return new Grid<T>(0, 0);
    }

    const width = array[0].length;
    array.forEach((row) => {
      if (width !== row.length) {
        throw new Error("Width of 2D Array not consistent");
      }
    });

    const ret = new Grid<T>(width, height);
    ret.arr = array.flat(1);
    return ret;
  }

  to2DArray(): T[][] {
    const ret: T[][] = [];
    for (let i = 0; i < this.height; ++i) {
      ret.push(this.arr.slice(i * this.width, (i + 1) * this.width));
    }
    return ret;
  }

  /** Note: Unlike its Array counterpart, this method does not take a start and end.
   */
  fill(val: T): Grid<T> {
    this.arr.fill(val);
    return this;
  }

  neighbors(index: CoordinateLike) {
    if (!this.isInBounds(index)) {
      // An alternative is to return edge points for some out-of-bounds inputs,
      // but our floodfill algorithms depend on an empty array here.
      return [];
    }
    const { x, y } = index;
    return [
      { x, y: y - 1 },
      { x, y: y + 1 },
      { x: x - 1, y },
      { x: x + 1, y },
    ].filter((index) => this.isInBounds(index));
  }

  isInBounds({ x, y }: CoordinateLike) {
    const w = this.width;
    const h = this.height;
    return x < w && y < h && x >= 0 && y >= 0;
  }

  reduce<OutT>(
    callbackfn: (
      previousValue: OutT,
      currentValue: T,
      index: Coordinate,
      array: Grid<T>
    ) => OutT,
    initialValue: OutT
  ): OutT {
    return this.arr.reduce(
      (previousValue, currentValue, flat_index) =>
        callbackfn(
          previousValue,
          currentValue,
          flat_index_to_coordinate(flat_index, this.width),
          this
        ),
      initialValue
    );
  }
}

function flat_index_to_coordinate(index: number, width: number): Coordinate {
  return new Coordinate(index % width, Math.floor(index / width));
}

function coordinate_to_flat_index(
  { x, y }: CoordinateLike,
  width: number
): number {
  return y * width + x;
}

/** If index is negative, count from the end of the row or column. */
function handleNegativeIndices(
  { x, y }: CoordinateLike,
  w: number,
  h: number
): Coordinate {
  // Backwards indexing
  if (x < 0) {
    x = w + x;
  }
  if (y < 0) {
    y = h + y;
  }
  return new Coordinate(x, y);
}
