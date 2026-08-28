import { Coordinate, type CoordinateLike } from "./coordinate";
import { Dimensions } from "./dimensions";
import { Fillable } from "./group_utils";

/**
 * A 2D analog to the native JavaScript array.  As much as possible,
 * the API should match that of a regular Array.
 */
export class Grid<T> implements Fillable<CoordinateLike, T> {
  private arr: Array<T>;
  public readonly dims: Dimensions;

  constructor(width: number, height: number) {
    this.dims = new Dimensions(width, height);
    this.arr = new Array(this.dims.area);
  }

  get width(): number {
    return this.dims.width;
  }

  get height(): number {
    return this.dims.height;
  }

  at(index: CoordinateLike): T | undefined {
    index = this.dims.resolveNegativeIndices(index);

    if (!this.isInBounds(index)) {
      return undefined;
    }
    return this.arr[this.dims.toFlatIndex(index)];
  }

  set(index: CoordinateLike, value: T): void {
    index = this.dims.resolveNegativeIndices(index);

    if (!this.isInBounds(index)) {
      return;
    }

    this.arr[this.dims.toFlatIndex(index)] = value;
  }

  map<S>(
    callbackfn: (value: T, index: Coordinate, grid: Grid<T>) => S,
    thisArg?: this,
  ): Grid<S> {
    const ret = new Grid<S>(this.width, this.height);
    ret.arr = this.arr.map(
      (value: T, flat_index: number) =>
        callbackfn(value, this.dims.fromFlatIndex(flat_index), this),
      thisArg,
    );
    return ret;
  }

  forEach(
    callbackfn: (value: T, index: Coordinate, grid: Grid<T>) => void,
    thisArg?: this,
  ): void {
    this.arr.forEach((value: T, flat_index: number) => {
      callbackfn(value, this.dims.fromFlatIndex(flat_index), this);
    }, thisArg);
  }

  static from2DArray<T>(array: T[][]): Grid<T> {
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

  neighbors(index: CoordinateLike): Coordinate[] {
    return this.dims.neighbors(index);
  }

  isInBounds(index: CoordinateLike): boolean {
    return this.dims.isInBounds(index);
  }

  reduce<OutT>(
    callbackfn: (
      previousValue: OutT,
      currentValue: T,
      index: Coordinate,
      array: Grid<T>,
    ) => OutT,
    initialValue: OutT,
  ): OutT {
    return this.arr.reduce(
      (previousValue, currentValue, flat_index) =>
        callbackfn(
          previousValue,
          currentValue,
          this.dims.fromFlatIndex(flat_index),
          this,
        ),
      initialValue,
    );
  }

  serialize() {
    return this.to2DArray();
  }
}
