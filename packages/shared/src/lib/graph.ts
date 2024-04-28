import { Fillable } from "./group_utils";

/*
export class Graph<TIntersection> implements Fillable<number, TIntersection> {
  private intersections: Map<number, TIntersection>;

  constructor(intersections: [TIntersection, number][] | Map<number, TIntersection>) {
    if (Array.isArray(intersections)) {
      this.intersections = new Map<number, TIntersection>(
        intersections.map(intersection => [intersection[1], intersection[0]]),
      );
      return;
    }
    this.intersections = intersections;
  }

  at(index: number): TIntersection | undefined {
    return this.intersections.get(index);
  }
  set(index: number, val: TIntersection): void {
    this.intersections.set(index, val);
  }
  map<V2>(f: (val: TIntersection) => V2): Fillable<number, V2> {
    return new Graph<V2>(
      [...this.intersections.entries()].map(([n, intersection]) => [f(intersection), n]),
    );
  }
  neighbors(index: number): number[] {}
  isInBounds(index: number): boolean {}
  forEach(f: (value: TIntersection, index: number) => void): void {}
}
*/

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
