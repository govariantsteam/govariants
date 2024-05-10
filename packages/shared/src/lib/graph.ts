import { Coordinate, CoordinateLike } from "./coordinate";
import { Fillable } from "./group_utils";

export type SerializedGraph<T> = { adjacency_array: number[][]; data: T[] };

export class Graph<T> implements Fillable<number, T> {
  private data: T[];
  private adjacency_array: number[][];
  constructor(adjacency_array: number[][]) {
    this.adjacency_array = copy2D(adjacency_array);
    this.data = new Array(adjacency_array.length);
  }

  at(index: number): T | undefined {
    return this.data.at(index);
  }

  set(index: number, value: T): void {
    this.data[index] = value;
  }

  map<S>(
    callbackfn: (value: T, index: number, grid: Graph<T>) => S,
    thisArg?: this,
  ): Graph<S> {
    const ret = new Graph<S>(this.adjacency_array);
    ret.data = this.data.map(
      (value: T, index: number) => callbackfn(value, index, this),
      thisArg,
    );
    return ret;
  }

  forEach(
    callbackfn: (value: T, index: number, grid: Graph<T>) => void,
    thisArg?: this,
  ): void {
    this.data.forEach((value: T, index: number) => {
      callbackfn(value, index, this);
    }, thisArg);
  }

  static fromPlainObject<T>(o: SerializedGraph<T>) {
    if (o.adjacency_array.length != o.data.length) {
      throw new Error("Adjacency array must be the same length as data array");
    }
    const ret = new Graph<T>(o.adjacency_array);
    ret.data = copyArray(o.data);
    return ret;
  }

  export(): SerializedGraph<T> {
    return {
      adjacency_array: copy2D(this.adjacency_array),
      data: copyArray(this.data),
    };
  }

  fill(val: T, start?: number, end?: number): Graph<T> {
    this.data.fill(val, start, end);
    return this;
  }

  neighbors(index: number) {
    return copyArray(this.adjacency_array[index]);
  }

  isInBounds(index: number) {
    return index >= 0 && index < this.data.length;
  }

  reduce<OutT>(
    callbackfn: (
      previousValue: OutT,
      currentValue: T,
      index: number,
      array: Graph<T>,
    ) => OutT,
    initialValue: OutT,
  ): OutT {
    return this.data.reduce(
      (previousValue, currentValue, index) =>
        callbackfn(previousValue, currentValue, index, this),
      initialValue,
    );
  }

  serialize() {
    return [...this.data];
  }
}

function identity<T>(x: T): T {
  return x;
}
function copyArray<T>(a: T[]): T[] {
  return a.map(identity);
}
function copy2D<T>(a: T[][]): T[][] {
  return a.map(copyArray);
}

export class GraphWrapper<T> implements Fillable<CoordinateLike, T> {
  private graph: Graph<T>;

  constructor(graph: Graph<T>) {
    this.graph = graph;
  }

  private packNumber(num: number): Coordinate {
    return new Coordinate(num, 0);
  }

  private unpackCoordinate(coord: CoordinateLike): number {
    if (coord.y !== 0) {
      throw Error(
        "Implementation Error: Graph Wrapper accepty only coordinates with y = 0.",
      );
    }

    return coord.x;
  }

  at(index: CoordinateLike): T | undefined {
    return this.graph.at(this.unpackCoordinate(index));
  }
  set(index: CoordinateLike, val: T): void {
    this.graph.set(this.unpackCoordinate(index), val);
  }
  map<TDest>(f: (val: T) => TDest): GraphWrapper<TDest> {
    return new GraphWrapper(this.graph.map(f));
  }
  neighbors(index: CoordinateLike): Coordinate[] {
    return this.graph
      .neighbors(this.unpackCoordinate(index))
      .map(this.packNumber);
  }
  isInBounds(index: CoordinateLike): boolean {
    return this.graph.isInBounds(this.unpackCoordinate(index));
  }
  forEach(f: (value: T, index: CoordinateLike) => void): void {
    return this.graph.forEach((value: T, index: number) =>
      f(value, this.packNumber(index)),
    );
  }

  serialize() {
    // Return a 2D array, since this looks a lot like a Grid.
    return [this.graph.serialize()];
  }
}
