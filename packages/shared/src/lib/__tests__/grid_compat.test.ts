import { Coordinate } from "../coordinate";
import { indexToMove } from "../grid_compat";

test("indexToMove", () => {
  expect(indexToMove(new Coordinate(2, 3))).toBe("cd");
  expect(indexToMove({ x: 2, y: 3 })).toBe("cd");
  expect(indexToMove(42)).toBe("42");
});
