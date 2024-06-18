import { Intersection } from "./intersection";
import { Intersection as IntersectionOld } from "../../variants/badukWithAbstractBoard/abstractBoard/intersection";
import { Vector2D } from "../../variants/badukWithAbstractBoard/abstractBoard/Vector2D";
import { CreatePolygonalBoard as createPolygonalBoard } from "../../variants/badukWithAbstractBoard/abstractBoard/PolygonalBoardHelper";
import { CreateCircularBoard } from "../../variants/badukWithAbstractBoard/abstractBoard/CircularBoardHelper";
import { TrihexagonalBoardHelper } from "../../variants/badukWithAbstractBoard/abstractBoard/TrihexagonalBoardHelper";
import { createSierpinskyBoard as createSierpinskyBoardExternal } from "../../variants/badukWithAbstractBoard/abstractBoard/SierpinskyBoard";
import { Graph } from "../graph";
import { Grid } from "../grid";

export const BoardPattern = {
  Grid: "grid",
  Polygonal: "polygonal",
  Circular: "circular",
  Trihexagonal: "trihexagonal",
  Sierpinsky: "sierpinsky",
  GridWithHoles: "gridWithHoles",
} as const;

export type BoardConfig =
  | GridBoardConfig
  | RhombitrihexagonalBoardConfig
  | CircularBoardConfig
  | TrihexagonalBoardConfig
  | SierpinskyBoardConfig
  | GridWithHolesBoardConfig;

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

export interface GridWithHolesBoardConfig {
  type: "gridWithHoles";
  bitmap: (0 | 1 | 2 | 3 | 4)[][];
  // 0: no intersection
  // 0b01: connect to the right
  // 0b10: connect down
  // 0b11: connect down and to the right
  // 0b100: intersection with just existing connections up or to the left
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
    case "gridWithHoles":
      intersections = createGridWithHolesBoard<TIntersection>(
        config,
        intersectionConstructor,
      );
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
  startColor: TColor,
): Graph<TColor> {
  const adjacencyMatrix = intersections.map((intersection) =>
    intersection.neighbours.map((neighbour) =>
      intersections.indexOf(neighbour),
    ),
  );
  return new Graph<TColor>(adjacencyMatrix).fill(startColor);
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

function createGridWithHolesBoard<TIntersection extends Intersection>(
  config: GridWithHolesBoardConfig,
  intersectionConstructor: IntersectionConstructor<TIntersection>,
): TIntersection[] {
  const bitGrid = Grid.from2DArray(config.bitmap);
  let counter = -1;
  const intersections = bitGrid.map((isIntersection, index) =>
    isIntersection
      ? new intersectionConstructor(new Vector2D(index.x, index.y), ++counter)
      : null,
  );

  intersections.forEach((intersection, index) => {
    if (!intersection) return;
    intersection.id = intersections.width * index.y + index.x;
    intersections
      .neighbors(index)
      .filter((neighbourIndex) => {
        const bits = bitGrid.at(index);
        return (
          bits &&
          ((bits & 1 && index.x < neighbourIndex.x) ||
            (bits & 2 && index.y < neighbourIndex.y))
        );
      })
      .forEach((neighbourIndex) =>
        intersections.at(neighbourIndex)?.connectTo(intersection, true),
      );
  });

  return intersections
    .to2DArray()
    .flat()
    .filter((intersection): intersection is TIntersection => !!intersection)
    .map((intersection, index) => {
      intersection.id = index;
      return intersection;
    });
  // The mapping is necessary curently,
  // because Graph apparently expects an intersection's ID to be its index.
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
