import { Grid } from "../grid";
import {
  getGroup,
  floodFill,
  getOuterBorder,
  getInnerBorder,
} from "../group_utils";

function expectArraysToHaveSameElements(
  actual: unknown[],
  expected: unknown[]
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
