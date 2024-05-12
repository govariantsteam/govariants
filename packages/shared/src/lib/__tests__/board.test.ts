import { Color } from "../../variants/badukWithAbstractBoard";
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

  // Remark: This test case is not independent of implementation
  // Also see PolygonalBoardHelper lines 4 - 28
  expect(graph.neighbors(0)).toEqual([1, 5, 6, 17]);
});
