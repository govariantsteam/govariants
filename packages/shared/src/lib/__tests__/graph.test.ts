import { Graph } from "../graph";

// 0 <-> 1 <-> 2
const TINY_GRAPH = [[1], [0, 2], [1]];

test("constructor", () => {
  new Graph(TINY_GRAPH);
});

test("map", () => {
  const g = Graph.fromPlainObject({
    adjacency_array: TINY_GRAPH,
    data: [1, 2, 3],
  });

  const two_times = g.map((val) => val * 2);

  expect(two_times.export()).toEqual({
    adjacency_array: TINY_GRAPH,
    data: [2, 4, 6],
  });
});

test("map index", () => {
  const g = new Graph<undefined>(TINY_GRAPH).fill(undefined);

  const indexes = g.map((_val, idx) => idx);

  expect(indexes.export()).toEqual({
    adjacency_array: TINY_GRAPH,
    data: [0, 1, 2],
  });
});

test("at", () => {
  const g = Graph.fromPlainObject({
    adjacency_array: TINY_GRAPH,
    data: [123, "abc", undefined],
  });

  expect(g.at(0)).toBe(123);
  expect(g.at(1)).toBe("abc");
  expect(g.at(2)).toBe(undefined);
});

test("set", () => {
  const g = Graph.fromPlainObject({
    adjacency_array: TINY_GRAPH,
    data: [1, 2, 3],
  });
  g.set(1, 10);

  expect(g.at(1)).toBe(10);
});

test("neighbors", () => {
  const g = new Graph(TINY_GRAPH);
  expect(g.neighbors(0)).toEqual([1]);
  expect(g.neighbors(1)).toEqual([0, 2]);
  expect(g.neighbors(2)).toEqual([1]);
});

test("forEach on unset array", () => {
  const g = new Graph(TINY_GRAPH);
  const f = jest.fn();
  g.forEach(f);
  expect(f).not.toBeCalled();

  // Try setting exactly one value and doing the same
  g.set(1, "abc");
  g.forEach(f);
  expect(f).toBeCalledTimes(1);
  expect(f).toBeCalledWith("abc", 1, g);
});

test("reduce", () => {
  const g = Graph.fromPlainObject({
    adjacency_array: TINY_GRAPH,
    data: [1, 2, 3],
  });

  expect(g.reduce((x, y) => x + y, 0)).toEqual(6);
});

test("empty slots are undefined", () => {
  const g = new Graph(TINY_GRAPH);
  expect(g.at(1)).toBeUndefined();
});

test("out of bounds is undefined", () => {
  const g = Graph.fromPlainObject({
    adjacency_array: TINY_GRAPH,
    data: [1, 2, 3],
  });
  // out-of-bounds
  expect(g.at(4)).toBeUndefined();
});
