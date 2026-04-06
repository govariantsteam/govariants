import {
  BoardPattern,
  createBoard,
  createGraph,
} from "../abstractBoard/boardFactory";
import { Intersection } from "../abstractBoard/intersection";
import { Color } from "../../variants/baduk";

// Depth 7 = 9,843 intersections (under the 10K board cap). With the old O(n²)
// indexOf this was slow; with the Map-based lookup it takes ~9ms. A 500ms
// budget catches regressions without flaking on slow CI runners.
test("sierpinski depth 7 board+graph creation completes under 500ms", () => {
  const start = performance.now();
  const intersections = createBoard(
    { type: BoardPattern.Sierpinsky, size: 7 },
    Intersection,
  );
  createGraph(intersections, Color.EMPTY);
  const elapsed = performance.now() - start;

  expect(elapsed).toBeLessThan(500);
});
