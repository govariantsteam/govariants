import { Color } from "../../variants/baduk";
import {
  BoardPattern,
  createBoard,
  createGraph,
} from "../abstractBoard/boardFactory";
import { Intersection } from "../abstractBoard/intersection";

test("create rhombitrihexagonal board", () => {
  const intersections = createBoard(
    {
      type: BoardPattern.Polygonal,
      size: 2,
    },
    Intersection,
  );
  const graph = createGraph(intersections, Color.EMPTY);

  expect(
    graph.reduce<number>(
      (prev, _, index, g) => prev + g.neighbors(index).length,
      0,
    ),
  ).toEqual(6 * 4 + 12 * 3);

  // Remark: This assertion is not independent of implementation
  // Also see PolygonalBoardHelper lines 4 - 28
  expect(graph.neighbors(0)).toEqual([1, 5, 6, 17]);
});

test("create custom board", () => {
  // Just a 2x2 grid board
  const intersections = createBoard(
    {
      type: BoardPattern.Custom,
      coordinates: [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ],
      adjacencyList: [
        [1, 2],
        [0, 3],
        [0, 3],
        [1, 2],
      ],
    },
    Intersection,
  );

  expect(intersections).toHaveLength(4);

  expect(intersections[0].position).toEqual({ X: 0, Y: 0 });
  expect(intersections[0].neighbours).toHaveLength(2);
});
