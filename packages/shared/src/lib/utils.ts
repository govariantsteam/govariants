import { GamesFilter } from "../api_types";

export interface MovesType {
  [player: number]: string;
}

export function getOnlyMove(moves: MovesType): {
  player: number;
  move: string;
} {
  const players = Object.keys(moves);
  if (players.length > 1) {
    throw new Error(`More than one player: ${players}`);
  }
  if (players.length === 0) {
    throw new Error("No players specified!");
  }
  const player = Number(players[0]);
  return { player, move: moves[player] };
}

export function gamesFilterToUrlParams(filter: GamesFilter): string {
  return (
    (filter.user_id ? `&user_id=${encodeURIComponent(filter.user_id)}` : "") +
    (filter.variant === "" || filter.variant === undefined
      ? ""
      : `&variant=${encodeURIComponent(filter.variant)}`)
  );
}

export function assertRectangular2DArrayOf<T>(
  arr: unknown,
  typeGuard: (x: unknown) => x is T,
): T[][] {
  if (!Array.isArray(arr) || arr.some((row) => !Array.isArray(row))) {
    throw new Error("2D array expected!");
  }
  const array2D = arr as unknown[][];
  const width = array2D[0].length;

  if (array2D.some((row) => row.length !== width)) {
    throw new Error("Expected an array with all rows of the same size!");
  }

  if (!array2D.every((row) => row.every(typeGuard))) {
    throw new Error("Expected an array with all elements of a given type!");
  }

  return array2D as T[][];
}

export function getNullIndices(arr: unknown[]) {
  return arr.reduce((indexes: number[], element, index) => {
    if (element == null) {
      indexes.push(index);
    }
    return indexes;
  }, []);
}

export function sum(array: number[]): number {
  return array.reduce((a, b) => a + b, 0);
}

export function groupBy<T, K>(arr: T[], selector: (v: T) => K): [K, T[]][] {
  return [
    ...arr
      .reduce((map, item) => {
        const key = selector(item);
        (map.get(key) ?? map.set(key, []).get(key)!).push(item);
        return map;
      }, new Map<K, T[]>())
      .entries(),
  ];
}

export function map2d<TSource, TDestination>(
  arr: TSource[][],
  map: (
    entry: TSource,
    row_index: number,
    column_index: number,
  ) => TDestination,
): TDestination[][] {
  return arr.map((row, row_index) =>
    row.map((entry, column_index) => map(entry, row_index, column_index)),
  );
}
