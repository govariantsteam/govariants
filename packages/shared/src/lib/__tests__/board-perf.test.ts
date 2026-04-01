import {
  BoardPattern,
  createBoard,
  createGraph,
} from "../abstractBoard/boardFactory";
import { Intersection } from "../abstractBoard/intersection";
import { Color } from "../../variants/baduk";

// Depth 8 = 29,526 intersections. With the old O(n²) indexOf this took ~400ms;
// with the Map-based lookup it takes ~15ms. A 500ms budget catches regressions
// without flaking on slow CI runners.
test("sierpinski depth 8 board+graph creation completes under 500ms", () => {
  const start = performance.now();
  const intersections = createBoard(
    { type: BoardPattern.Sierpinsky, size: 8 },
    Intersection,
  );
  createGraph(intersections, Color.EMPTY);
  const elapsed = performance.now() - start;

  expect(elapsed).toBeLessThan(500);
});
