import { Coordinate } from "../coordinate";

test("constructor", () => {
  const pos = new Coordinate(2, 3);
  expect(pos.x).toBe(2);
  expect(pos.y).toBe(3);
});

test("fromSgfRepr", () => {
  const pos = Coordinate.fromSgfRepr("cd");
  expect(pos.x).toBe(2);
  expect(pos.y).toBe(3);
});

test("toSgfRepr", () => {
  const pos = new Coordinate(2, 3);
  expect(pos.toSgfRepr()).toBe("cd");
});

test("Out of bounds", () => {
  // The highest SGF supports is 52 (twice the alphabet)
  const pos = new Coordinate(0, 64);
  expect(() => pos.toSgfRepr()).toThrowError();
});
