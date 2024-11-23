import { Grid } from "../grid";
import {
  getGroup,
  floodFill,
  getOuterBorder,
  getInnerBorder,
  examineGroup,
} from "../group_utils";

function expectArraysToHaveSameElements(
  actual: unknown[],
  expected: unknown[],
) {
  expect(actual).toHaveLength(expected.length);
  expect(actual).toEqual(expect.arrayContaining(expected));
}

test("getGroup out-of-bounds", () => {
  const g = Grid.from2DArray([
    [1, 1, 2],
    [1, 1, 2],
    [2, 2, 2],
  ]);
  expect(getGroup({ x: 3, y: 1 }, g)).toHaveLength(0);
});

test("getGroup", () => {
  const g = Grid.from2DArray([
    [1, 1, 2],
    [1, 1, 2],
    [2, 2, 2],
  ]);
  expectArraysToHaveSameElements(getGroup({ x: 1, y: 1 }, g), [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ]);
  expectArraysToHaveSameElements(getGroup({ x: 0, y: 2 }, g), [
    { x: 0, y: 2 },
    { x: 1, y: 2 },
    { x: 2, y: 2 },
    { x: 2, y: 1 },
    { x: 2, y: 0 },
  ]);
});

test("floodFill", () => {
  const g = Grid.from2DArray([
    [1, 2, 2, 1],
    [1, 2, 2, 1],
    [2, 1, 1, 1],
    [2, 2, 1, 1],
  ]);
  floodFill(3, { x: 2, y: 2 }, g);
  expect(g.to2DArray()).toEqual([
    [1, 2, 2, 3],
    [1, 2, 2, 3],
    [2, 3, 3, 3],
    [2, 2, 3, 3],
  ]);
});

test("getOuterBorder", () => {
  const grid = Grid.from2DArray([
    [1, 1, 1, 2],
    [1, 1, 1, 2],
    [1, 1, 2, 2],
    [2, 2, 2, 2],
  ]);
  const group = getGroup({ x: 0, y: 0 }, grid);
  expectArraysToHaveSameElements(getOuterBorder(group, grid), [
    { x: 0, y: 3 },
    { x: 1, y: 3 },
    { x: 2, y: 2 },
    { x: 3, y: 1 },
    { x: 3, y: 0 },
  ]);
});

test("getInnerBorder", () => {
  const grid = Grid.from2DArray([
    [1, 1, 1, 2],
    [1, 1, 1, 2],
    [1, 1, 2, 2],
    [2, 2, 2, 2],
  ]);
  const group = getGroup({ x: 0, y: 0 }, grid);
  expectArraysToHaveSameElements(getInnerBorder(group, grid), [
    { x: 0, y: 2 },
    { x: 1, y: 2 },
    { x: 2, y: 1 },
    { x: 2, y: 0 },
  ]);
});

test("getGroup - undefined group", () => {
  const grid: Grid<undefined | number> = Grid.from2DArray([
    [undefined, 0, 1],
    [undefined, 0, 1],
    [undefined, 0, 1],
  ]);
  expect(getGroup({ x: 0, y: 0 }, grid)).toHaveLength(3);
});

test("examineGroup", () => {
  const g = Grid.from2DArray([
    [
      [1, 2],
      [1, 2],
      [1, 3],
    ],
    [[1, 2], [], [1, 3]],
    [
      [1, 3],
      [1, 3],
      [1, 3],
    ],
  ]);

  const examineResult1 = examineGroup({
    index: { x: 0, y: 0 },
    board: g,
    groupIdentifier: (colors) => colors.includes(2),
    libertyIdentifier: (colors) => colors.length === 0,
  });
  expectArraysToHaveSameElements(examineResult1.members, [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ]);
  expectArraysToHaveSameElements(examineResult1.adjacent, [
    { x: 0, y: 2 },
    { x: 1, y: 1 },
    { x: 2, y: 0 },
  ]);
  expect(examineResult1.liberties).toBe(1);

  const examineResult2 = examineGroup({
    index: { x: 2, y: 2 },
    board: g,
    groupIdentifier: (colors) => colors.includes(3),
    libertyIdentifier: (colors) => colors.length === 0,
  });
  expectArraysToHaveSameElements(examineResult2.members, [
    { x: 0, y: 2 },
    { x: 1, y: 2 },
    { x: 2, y: 2 },
    { x: 2, y: 1 },
    { x: 2, y: 0 },
  ]);
  expectArraysToHaveSameElements(examineResult2.adjacent, [
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ]);
  expect(examineResult2.liberties).toBe(1);

  const examineResult3 = examineGroup({
    index: { x: 2, y: 2 },
    board: g,
    groupIdentifier: (colors) => colors.includes(1),
    libertyIdentifier: (colors) => colors.length === 0,
  });
  expectArraysToHaveSameElements(examineResult3.members, [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: 2 },
    { x: 1, y: 2 },
    { x: 2, y: 2 },
    { x: 2, y: 1 },
    { x: 2, y: 0 },
    { x: 1, y: 0 },
  ]);
  expectArraysToHaveSameElements(examineResult3.adjacent, [{ x: 1, y: 1 }]);
  expect(examineResult3.liberties).toBe(1);
});
