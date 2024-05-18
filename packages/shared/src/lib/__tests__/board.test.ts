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
