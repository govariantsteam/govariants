import { isInBounds } from "../baduk_utils";

const at = (x: number, y = 0) => ({ x, y });

test("isInBounds on a grid board", () => {
  const config = {
    komi: 6.5,
    board: { type: "grid" as const, width: 3, height: 4 },
  };

  expect(isInBounds(config, at(1, 2))).toBe(true);
  expect(isInBounds(config, at(2, 3))).toBe(true);

  expect(isInBounds(config, at(3, 2))).toBe(false);
  expect(isInBounds(config, at(1, 4))).toBe(false);
  expect(isInBounds(config, at(-1, 2))).toBe(false);
});

test("isInBounds on a legacy grid config", () => {
  const config = { komi: 6.5, width: 3, height: 4 };

  expect(isInBounds(config, at(1, 2))).toBe(true);
  expect(isInBounds(config, at(3, 2))).toBe(false);
});

test("isInBounds on a graph board", () => {
  // sierpinsky size 3 has 123 intersections, which estimateNodeCount reports
  // exactly.
  const config = {
    komi: 6.5,
    board: { type: "sierpinsky" as const, size: 3 },
  };

  expect(isInBounds(config, at(0))).toBe(true);
  expect(isInBounds(config, at(122))).toBe(true);

  expect(isInBounds(config, at(123))).toBe(false);
  expect(isInBounds(config, at(-1))).toBe(false);
  // graph boards pack their index into x, so a nonzero y is never on the board
  expect(isInBounds(config, at(0, 1))).toBe(false);
});

test("isInBounds on a graph board whose intersections are shared", () => {
  // trihexagonal size 5 has 12 intersections, but estimateNodeCount only
  // bounds it at 25 - both sides of that gap must be out of bounds.
  const config = {
    komi: 6.5,
    board: { type: "trihexagonal" as const, size: 5 },
  };

  expect(isInBounds(config, at(11))).toBe(true);

  // below the estimate, so this needs the exact count
  expect(isInBounds(config, at(12))).toBe(false);
  // at and above the estimate, rejected without laying the board out
  expect(isInBounds(config, at(25))).toBe(false);
  expect(isInBounds(config, at(1000))).toBe(false);
});
