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
      intersections = createCubeBoard<TIntersection>(
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

/**
 * Creates a cube board where each face is a grid.
 * The cube has 6 faces arranged like a standard cube net.
 * Edges between faces are connected.
 *
 * Face layout (looking at an unfolded cube):
 *     [Top]
 * [Left][Front][Right][Back]
 *     [Bottom]
 *
 * Face indices: 0=Front, 1=Right, 2=Back, 3=Left, 4=Top, 5=Bottom
 */
function createCubeBoard<TIntersection extends Intersection>(
  config: CubeBoardConfig,
  intersectionConstructor: IntersectionConstructor<TIntersection>,
): TIntersection[] {
  const size = config.faceSize;
  const intersections: TIntersection[] = [];

  // Create 6 faces, each as a grid
  // We'll use a 3D coordinate system where each intersection has metadata
  // about which face it's on and its position within that face

  // Helper to get flat index from face, x, y
  const getIndex = (face: number, x: number, y: number): number => {
    return face * size * size + y * size + x;
  };

  // Create all intersections for all 6 faces
  for (let face = 0; face < 6; face++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Position intersections in 3D space for visualization
        // We'll arrange them in a cube net layout
        const pos = getCubeNetPosition(face, x, y, size);
        intersections.push(new intersectionConstructor(pos));
      }
    }
  }

  // Connect intersections within each face (grid connections)
  for (let face = 0; face < 6; face++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = getIndex(face, x, y);

        // Connect to right neighbor
        if (x < size - 1) {
          const rightIdx = getIndex(face, x + 1, y);
          intersections[idx].connectTo(intersections[rightIdx], true);
        }

        // Connect to bottom neighbor
        if (y < size - 1) {
          const bottomIdx = getIndex(face, x, y + 1);
          intersections[idx].connectTo(intersections[bottomIdx], true);
        }
      }
    }
  }

  // Connect edges between faces
  // This is the tricky part - we need to connect the edges of adjacent faces

  // Face adjacency:
  // 0=Front: top->4, right->1, bottom->5, left->3
  // 1=Right: top->4, right->2, bottom->5, left->0
  // 2=Back: top->4, right->3, bottom->5, left->1
  // 3=Left: top->4, right->0, bottom->5, left->2
  // 4=Top: top->2, right->1, bottom->0, left->3
  // 5=Bottom: top->0, right->1, bottom->2, left->3

  // Connect Front (0) edges
  connectCubeEdge(intersections, size, getIndex, 0, "top", 4, "bottom");
  connectCubeEdge(intersections, size, getIndex, 0, "right", 1, "left");
  connectCubeEdge(intersections, size, getIndex, 0, "bottom", 5, "top");
  connectCubeEdge(intersections, size, getIndex, 0, "left", 3, "right");

  // Connect Right (1) edges
  connectCubeEdge(intersections, size, getIndex, 1, "top", 4, "right");
  connectCubeEdge(intersections, size, getIndex, 1, "right", 2, "left");
  connectCubeEdge(intersections, size, getIndex, 1, "bottom", 5, "right");
  // left edge already connected to Front

  // Connect Back (2) edges
  connectCubeEdge(intersections, size, getIndex, 2, "top", 4, "top");
  connectCubeEdge(intersections, size, getIndex, 2, "right", 3, "left");
  connectCubeEdge(intersections, size, getIndex, 2, "bottom", 5, "bottom");
  // left edge already connected to Right

  // Connect Left (3) edges
  connectCubeEdge(intersections, size, getIndex, 3, "top", 4, "left");
  // right, bottom, left edges already connected

  // Top (4) and Bottom (5) edges are mostly connected already

  return intersections;
}

/**
 * Get the 2D position for displaying a cube net
 */
function getCubeNetPosition(
  face: number,
  x: number,
  y: number,
  size: number,
): Vector2D {
  // Cube net layout:
  //       [4: Top]
  // [3: Left][0: Front][1: Right][2: Back]
  //       [5: Bottom]

  const spacing = size + 1; // Add spacing between faces
  let baseX = 0,
    baseY = 0;

  switch (face) {
    case 0: // Front
      baseX = spacing;
      baseY = spacing;
      break;
    case 1: // Right
      baseX = spacing * 2;
      baseY = spacing;
      break;
    case 2: // Back
      baseX = spacing * 3;
      baseY = spacing;
      break;
    case 3: // Left
      baseX = 0;
      baseY = spacing;
      break;
    case 4: // Top
      baseX = spacing;
      baseY = 0;
      break;
    case 5: // Bottom
      baseX = spacing;
      baseY = spacing * 2;
      break;
  }

  return new Vector2D(baseX + x, baseY + y);
}

/**
 * Connect an edge of one face to an edge of another face
 */
function connectCubeEdge<TIntersection extends Intersection>(
  intersections: TIntersection[],
  size: number,
  getIndex: (face: number, x: number, y: number) => number,
  face1: number,
  edge1: "top" | "right" | "bottom" | "left",
  face2: number,
  edge2: "top" | "right" | "bottom" | "left",
): void {
  for (let i = 0; i < size; i++) {
    const [x1, y1] = getEdgeCoord(edge1, i, size);
    const [x2, y2] = getEdgeCoord(edge2, i, size);

    const idx1 = getIndex(face1, x1, y1);
    const idx2 = getIndex(face2, x2, y2);

    intersections[idx1].connectTo(intersections[idx2], true);
  }
}

/**
 * Get the x, y coordinates for a position along an edge
 */
function getEdgeCoord(
  edge: "top" | "right" | "bottom" | "left",
  i: number,
  size: number,
): [number, number] {
  switch (edge) {
    case "top":
      return [i, 0];
    case "right":
      return [size - 1, i];
    case "bottom":
      return [i, size - 1];
    case "left":
      return [0, i];
  }
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
