import { Intersection } from "./intersection";
import { Intersection as IntersectionOld } from "../../variants/badukWithAbstractBoard/abstractBoard/intersection";
import { Vector2D } from "../../variants/badukWithAbstractBoard/abstractBoard/Vector2D";
import { CreatePolygonalBoard as createPolygonalBoard } from "../../variants/badukWithAbstractBoard/abstractBoard/PolygonalBoardHelper";
import { CreateCircularBoard } from "../../variants/badukWithAbstractBoard/abstractBoard/CircularBoardHelper";
import { TrihexagonalBoardHelper } from "../../variants/badukWithAbstractBoard/abstractBoard/TrihexagonalBoardHelper";
import { createSierpinskyBoard as createSierpinskyBoardExternal } from "../../variants/badukWithAbstractBoard/abstractBoard/SierpinskyBoard";
import { Graph } from "../graph";

export const BoardPattern = {
  Grid: "grid",
  Polygonal: "polygonal",
  Circular: "circular",
  Trihexagonal: "trihexagonal",
  Sierpinsky: "sierpinsky",
} as const;

export type BoardConfig =
  | GridBoardConfig
  | RhombitrihexagonalBoardConfig
  | CircularBoardConfig
  | TrihexagonalBoardConfig
  | SierpinskyBoardConfig;

export interface GridBoardConfig {
  type: typeof BoardPattern.Grid;
  width: number;
  height: number;
}

export interface RhombitrihexagonalBoardConfig {
  type: typeof BoardPattern.Polygonal; // Is this rhombitrihexagonal?
  size: number;
}

export interface CircularBoardConfig {
  type: typeof BoardPattern.Circular;
  rings: number;
  nodesPerRing: number;
}

export interface TrihexagonalBoardConfig {
  type: typeof BoardPattern.Trihexagonal;
  size: number;
}

export interface SierpinskyBoardConfig {
  type: typeof BoardPattern.Sierpinsky;
  size: number;
}

export interface IntersectionConstructor<TIntersection extends Intersection> {
  new (vector: Vector2D, id: number): TIntersection;
}

export function createBoard<TIntersection extends Intersection>(
  config: BoardConfig,
  intersectionConstructor: IntersectionConstructor<TIntersection>,
): TIntersection[] {
  let intersections: TIntersection[];
  switch (config.type) {
    case BoardPattern.Grid:
      intersections = createGridBoard<TIntersection>(
        config,
        intersectionConstructor,
      );
      break;
    case BoardPattern.Polygonal:
      intersections = createRthBoard<TIntersection>(
        config,
        intersectionConstructor,
      );
      break;
    case BoardPattern.Circular:
      intersections = createCircularBoard<TIntersection>(
        config,
        intersectionConstructor,
      );
      break;
    case BoardPattern.Trihexagonal:
      intersections = createTrihexagonalBoard<TIntersection>(
        config,
        intersectionConstructor,
      );
      break;
    case BoardPattern.Sierpinsky:
      intersections = createSierpinskyBoard<TIntersection>(
        config,
        intersectionConstructor,
      );
      break;
  }
  return intersections;
}

function createGridBoard<TIntersection extends Intersection>(
  config: GridBoardConfig,
  intersectionConstructor: IntersectionConstructor<TIntersection>,
): TIntersection[] {
  const intersections: TIntersection[] = [];
  const array2D: TIntersection[][] = [];

  for (let y = 0; y < config.height; y++) {
    array2D.push(new Array<TIntersection>());
    for (let x = 0; x < config.width; x++) {
      const id = y * config.width + x;
      const intersection = new intersectionConstructor(new Vector2D(x, y), id);

      intersections.push(intersection);
      array2D[y].push(intersection);

      if (y > 0) {
        intersection.connectTo(array2D[y - 1][x], true);
      }
      if (x > 0) {
        intersection.connectTo(array2D[y][x - 1], true);
      }
    }
  }

  return intersections;
}

export function createGraph<TIntersection extends Intersection, TColor>(
  intersections: TIntersection[],
): Graph<TColor> {
  const adjacencyMatrix = intersections.map((intersection) =>
    intersection.neighbours.map((_neighbour, index) => index),
  );
  return new Graph<TColor>(adjacencyMatrix);
}

function createRthBoard<TIntersection extends Intersection>(
  config: RhombitrihexagonalBoardConfig,
  intersectionConstructor: IntersectionConstructor<TIntersection>,
): TIntersection[] {
  return convertIntersections<TIntersection>(
    createPolygonalBoard(config.size),
    intersectionConstructor,
  );
}

function createCircularBoard<TIntersection extends Intersection>(
  config: CircularBoardConfig,
  intersectionConstructor: IntersectionConstructor<TIntersection>,
): TIntersection[] {
  return convertIntersections<TIntersection>(
    CreateCircularBoard(config.rings, config.nodesPerRing),
    intersectionConstructor,
  );
}

function createTrihexagonalBoard<TIntersection extends Intersection>(
  config: TrihexagonalBoardConfig,
  intersectionConstructor: IntersectionConstructor<TIntersection>,
): TIntersection[] {
  return convertIntersections<TIntersection>(
    new TrihexagonalBoardHelper().CreateTrihexagonalBoard(config.size),
    intersectionConstructor,
  );
}

function createSierpinskyBoard<TIntersection extends Intersection>(
  config: SierpinskyBoardConfig,
  intersectionConstructor: IntersectionConstructor<TIntersection>,
): TIntersection[] {
  return convertIntersections<TIntersection>(
    createSierpinskyBoardExternal(config.size),
    intersectionConstructor,
  );
}

function convertIntersections<TIntersection extends Intersection>(
  old: IntersectionOld[],
  intersectionConstructor: IntersectionConstructor<TIntersection>,
): TIntersection[] {
  const intersections = new Map<TIntersection["id"], TIntersection>(
    old.map((o) => [
      o.Identifier,
      new intersectionConstructor(o.Position, o.Identifier),
    ]),
  );
  old.forEach((i) =>
    i.Neighbours.forEach((n) =>
      intersections
        .get(i.Identifier)!
        .connectTo(intersections.get(n.Identifier)!, false),
    ),
  );

  return Array.from(intersections.values());
}
