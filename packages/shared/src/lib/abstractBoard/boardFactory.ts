import { Intersection } from "./intersection";
import { Intersection as IntersectionOld } from "./helper/types/intersection";
import { Vector2D } from "./helper/types/Vector2D";
import { CreatePolygonalBoard as createPolygonalBoard } from "./helper/PolygonalBoardHelper";
import { CreateCircularBoard } from "./helper/CircularBoardHelper";
import { TrihexagonalBoardHelper } from "./helper/TrihexagonalBoardHelper";
import { createSierpinskyBoard as createSierpinskyBoardExternal } from "./helper/SierpinskyBoard";
import { Graph } from "../graph";
import { Grid } from "../grid";
import { createSunflowerBoard as createSunflowerBoardExternal } from "./helper/SunflowerHelper";
import { createCubeBoard as createCubeBoardHelper } from "./helper/CubeHelper";

export const BoardPattern = {
  Grid: "grid",
  Polygonal: "polygonal",
  Circular: "circular",
  Trihexagonal: "trihexagonal",
  Sierpinsky: "sierpinsky",
  GridWithHoles: "gridWithHoles",
  Sunflower: "sunflower",
  Cube: "cube",
  Custom: "custom",
} as const;

export type BoardConfig =
  | GridBoardConfig
  | RhombitrihexagonalBoardConfig
  | CircularBoardConfig
  | TrihexagonalBoardConfig
  | SierpinskyBoardConfig
  | GridWithHolesBoardConfig
  | SunflowerBoardConfig
  | CubeBoardConfig
  | CustomBoardConfig;

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

export interface SunflowerBoardConfig {
  type: typeof BoardPattern.Sunflower;
  size: number;
}

export interface CubeBoardConfig {
  type: typeof BoardPattern.Cube;
  faceSize: number; // Size of each face (e.g., 9 for a 9x9 grid on each face)
}

export interface CustomBoardConfig {
  type: typeof BoardPattern.Custom;
  coordinates: Array<[number, number]>;
  adjacencyList: number[][];
}

export interface IntersectionConstructor<TIntersection extends Intersection> {
  new (vector: Vector2D): TIntersection;
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
      break;
    case BoardPattern.Sunflower:
      intersections = createSunflowerBoard<TIntersection>(
        config,
        intersectionConstructor,
      );
      break;
    case BoardPattern.Cube:
      intersections = createCubeBoardHelper<TIntersection>(
        config,
        intersectionConstructor,
      );
      break;
    case BoardPattern.Custom:
      intersections = createCustomBoard<TIntersection>(
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
      const intersection = new intersectionConstructor(new Vector2D(x, y));

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
  const intersections = bitGrid.map((isIntersection, index) =>
    isIntersection
      ? new intersectionConstructor(new Vector2D(index.x, index.y))
      : null,
  );

  intersections.forEach((intersection, index) => {
    if (!intersection) return;
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
    .filter((intersection): intersection is TIntersection => !!intersection);
}

function createSunflowerBoard<TIntersection extends Intersection>(
  config: SunflowerBoardConfig,
  intersectionConstructor: IntersectionConstructor<TIntersection>,
): TIntersection[] {
  return convertIntersections<TIntersection>(
    createSunflowerBoardExternal(config.size),
    intersectionConstructor,
  );
}

function createCustomBoard<TIntersection extends Intersection>(
  config: CustomBoardConfig,
  intersectionConstructor: IntersectionConstructor<TIntersection>,
): TIntersection[] {
  const intersections = config.coordinates.map(
    (val) => new intersectionConstructor(new Vector2D(val[0], val[1])),
  );
  config.adjacencyList.forEach((neighbors, idx) => {
    neighbors.forEach((neighbor) => {
      intersections[idx].connectTo(intersections[neighbor], false);
    });
  });

  return intersections;
}

function convertIntersections<TIntersection extends Intersection>(
  old: IntersectionOld[],
  intersectionConstructor: IntersectionConstructor<TIntersection>,
): TIntersection[] {
  const intersections = new Map<number, TIntersection>(
    old.map((o, index) => [index, new intersectionConstructor(o.Position)]),
  );
  old.forEach((i, index) =>
    i.Neighbours.forEach((n) =>
      intersections
        .get(index)!
        .connectTo(intersections.get(old.indexOf(n))!, false),
    ),
  );

  return Array.from(intersections.values());
}
