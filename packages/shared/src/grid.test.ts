import { Grid } from "./grid";

test("constructor", () => {
  const g = new Grid(2, 3);
  expect(g.width).toBe(2);
  expect(g.height).toBe(3);
});

test("map", () => {
  const g = Grid.from2DArray([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ]);

  const two_times = g.map((val) => val * 2);

  expect(two_times.to2DArray()).toEqual([
    [2, 4, 6],
    [8, 10, 12],
    [14, 16, 18],
  ]);
});

test("map index", () => {
  const g = new Grid<undefined>(3, 4).fill(undefined);

  const times_table = g.map((_val, { x, y }) => x * y);

  expect(times_table.to2DArray()).toEqual([
    [0, 0, 0],
    [0, 1, 2],
    [0, 2, 4],
    [0, 3, 6],
  ]);
});

test("at", () => {
  const g = Grid.from2DArray([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ]);

  expect(g.at({ x: 0, y: 0 })).toBe(1);
  expect(g.at({ x: 1, y: 0 })).toBe(2);
  expect(g.at({ x: 2, y: 0 })).toBe(3);
  expect(g.at({ x: 0, y: 1 })).toBe(4);
  expect(g.at({ x: 1, y: 1 })).toBe(5);
  expect(g.at({ x: 2, y: 1 })).toBe(6);
  expect(g.at({ x: 0, y: 2 })).toBe(7);
  expect(g.at({ x: 1, y: 2 })).toBe(8);
  expect(g.at({ x: 2, y: 2 })).toBe(9);
});
