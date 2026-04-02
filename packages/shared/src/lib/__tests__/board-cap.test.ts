import { BoardPattern, createBoard } from "../abstractBoard/boardFactory";
import { Intersection } from "../abstractBoard/intersection";

test("rejects boards exceeding max node limit", () => {
  // Sierpinski depth 8 = 29,526 intersections, well over the 10K cap
  expect(() =>
    createBoard({ type: BoardPattern.Sierpinsky, size: 8 }, Intersection),
  ).toThrow(/Board too large/);
});

test("allows boards under the limit", () => {
  // Sierpinski depth 6 = 3,282 intersections
  const intersections = createBoard(
    { type: BoardPattern.Sierpinsky, size: 6 },
    Intersection,
  );
  expect(intersections.length).toBe(3282);
});
