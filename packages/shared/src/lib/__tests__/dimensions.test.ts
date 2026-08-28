import { Coordinate } from "../coordinate";
import { Dimensions } from "../dimensions";

test("constructor", () => {
  const dims = new Dimensions(2, 3);
  expect(dims.width).toBe(2);
  expect(dims.height).toBe(3);
  expect(dims.area).toBe(6);
});

test("constructor rejects negative dimensions", () => {
  expect(() => new Dimensions(-1, 3)).toThrow();
  expect(() => new Dimensions(2, -1)).toThrow();
});

test("from", () => {
  expect(Dimensions.from({ width: 2, height: 3 })).toEqual(
    new Dimensions(2, 3),
  );
});

test("isInBounds", () => {
  const dims = new Dimensions(3, 4);

  expect(dims.isInBounds({ x: 1, y: 2 })).toBe(true);
  expect(dims.isInBounds({ x: 0, y: 0 })).toBe(true);
  expect(dims.isInBounds({ x: 2, y: 3 })).toBe(true);

  expect(dims.isInBounds({ x: 3, y: 2 })).toBe(false);
  expect(dims.isInBounds({ x: 1, y: 4 })).toBe(false);
  expect(dims.isInBounds({ x: -1, y: 2 })).toBe(false);
  expect(dims.isInBounds({ x: 1, y: -1 })).toBe(false);
});

test("neighbors", () => {
  const dims = new Dimensions(3, 4);

  expect(dims.neighbors({ x: 1, y: 2 })).toEqual([
    new Coordinate(1, 1),
    new Coordinate(1, 3),
    new Coordinate(0, 2),
    new Coordinate(2, 2),
  ]);

  // corner
  expect(dims.neighbors({ x: 0, y: 0 })).toEqual([
    new Coordinate(0, 1),
    new Coordinate(1, 0),
  ]);

  // out of bounds
  expect(dims.neighbors({ x: 3, y: 0 })).toEqual([]);
});

test("flat index round trip", () => {
  const dims = new Dimensions(3, 4);

  expect(dims.toFlatIndex({ x: 2, y: 1 })).toBe(5);
  expect(dims.fromFlatIndex(5)).toEqual(new Coordinate(2, 1));

  dims.forEach((index) => {
    expect(dims.fromFlatIndex(dims.toFlatIndex(index))).toEqual(index);
  });
});

test("resolveNegativeIndices", () => {
  const dims = new Dimensions(3, 4);

  expect(dims.resolveNegativeIndices({ x: -1, y: -2 })).toEqual(
    new Coordinate(2, 2),
  );
  expect(dims.resolveNegativeIndices({ x: 1, y: 2 })).toEqual(
    new Coordinate(1, 2),
  );
});

test("forEach visits every coordinate in row-major order", () => {
  const visited: Coordinate[] = [];
  new Dimensions(2, 3).forEach((index) => visited.push(index));

  expect(visited).toEqual([
    new Coordinate(0, 0),
    new Coordinate(1, 0),
    new Coordinate(0, 1),
    new Coordinate(1, 1),
    new Coordinate(0, 2),
    new Coordinate(1, 2),
  ]);
});

test("equals", () => {
  const dims = new Dimensions(2, 3);

  expect(dims.equals({ width: 2, height: 3 })).toBe(true);
  expect(dims.equals({ width: 3, height: 2 })).toBe(false);
});
