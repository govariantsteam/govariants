import { Intersection } from "./intersection";
import { Intersection as IntersectionOld } from "../../variants/badukWithAbstractBoard/abstractBoard/intersection";
import { Vector2D } from "../../variants/badukWithAbstractBoard/abstractBoard/Vector2D";
import { CreatePolygonalBoard as createPolygonalBoard } from "../../variants/badukWithAbstractBoard/abstractBoard/PolygonalBoardHelper";

export type BoardConfig = GridBoardConfig | RhombitrihexagonalBoardConfig;

export interface GridBoardConfig {
  type: "grid";
  width: number;
  height: number;
}

export interface RhombitrihexagonalBoardConfig {
  type: "polygonal"; // Is this rhombitrihexagonal?
  size: number;
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
    case "grid":
      intersections = createGridBoard<TIntersection>(
        config,
        intersectionConstructor,
      );
      break;
    case "polygonal":
      intersections = createRthBoard<TIntersection>(
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
      intersection.id = y * config.width + x;

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

function createRthBoard<TIntersection extends Intersection>(
  config: RhombitrihexagonalBoardConfig,
  intersectionConstructor: IntersectionConstructor<TIntersection>,
): TIntersection[] {
  return convertIntersections<TIntersection>(
    createPolygonalBoard(config.size),
    intersectionConstructor,
  );
}

function convertIntersections<TIntersection extends Intersection>(
  old: IntersectionOld[],
  intersectionConstructor: IntersectionConstructor<TIntersection>,
): TIntersection[] {
  const intersections = new Map<TIntersection["id"], TIntersection>(
    old.map((o) => [o.Identifier, new intersectionConstructor(o.Position)]),
  );
  old.forEach((i) => {
    const newIntersection = intersections.get(i.Identifier)!;
    newIntersection.id = i.Identifier;

    i.Neighbours.forEach((n) =>
      newIntersection.connectTo(intersections.get(n.Identifier)!, false),
    );
  });

  return Array.from(intersections.values());
}
