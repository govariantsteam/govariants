import { getHoshi } from "../hoshi";

test("19x19 has the standard star points", () => {
  const hoshi = getHoshi(19, 19);
  hoshi.sort((a, b) => {
    if (a.x === b.x) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });
  const normalizedHoshi = hoshi.map(({ x, y }) => ({ x, y }));

  expect(normalizedHoshi).toEqual([
    { x: 3, y: 3 },
    { x: 3, y: 9 },
    { x: 3, y: 15 },
    { x: 9, y: 3 },
    { x: 9, y: 9 },
    { x: 9, y: 15 },
    { x: 15, y: 3 },
    { x: 15, y: 9 },
    { x: 15, y: 15 },
  ]);
});
