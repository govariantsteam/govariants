import {
  allPairsShortestPaths,
  eccentricity,
  generalizedPyramid,
} from "../graph-utils";

test("allPairsShortestPaths", () => {
  // adjacency list of a 5x5 rectangular grid.
  // vertices enumerated left-right, top-bottom.
  const graph_5x5_adjacency = [
    [1, 5],
    [0, 2, 6],
    [1, 3, 7],
    [2, 4, 8],
    [3, 9],
    [0, 6, 10],
    [1, 5, 7, 11],
    [2, 6, 8, 12],
    [3, 7, 9, 13],
    [4, 8, 14],
    [5, 11, 15],
    [6, 10, 12, 16],
    [7, 11, 13, 17],
    [8, 12, 14, 18],
    [9, 13, 19],
    [10, 16, 20],
    [11, 15, 17, 21],
    [12, 16, 18, 22],
    [13, 17, 19, 23],
    [14, 18, 24],
    [15, 21],
    [20, 16, 22],
    [21, 17, 23],
    [22, 18, 24],
    [19, 23],
  ];

  const dists = allPairsShortestPaths(graph_5x5_adjacency);
  expect(dists).toBeTruthy();
  expect(dists).toHaveLength(25);
  expect(dists[0]).toEqual([
    0, 1, 2, 3, 4, 1, 2, 3, 4, 5, 2, 3, 4, 5, 6, 3, 4, 5, 6, 7, 4, 5, 6, 7, 8,
  ]);

  const ecc = eccentricity(graph_5x5_adjacency);
  expect(ecc).toBeTruthy();
  expect(ecc).toHaveLength(25);
  expect(ecc).toEqual([
    8, 7, 6, 7, 8, 7, 6, 5, 6, 7, 6, 5, 4, 5, 6, 7, 6, 5, 6, 7, 8, 7, 6, 7, 8,
  ]);

  const pyr = generalizedPyramid(graph_5x5_adjacency);
  expect(pyr).toBeTruthy();
  expect(pyr).toHaveLength(25);
  expect(pyr).toEqual([
    1, 2, 3, 2, 1, 2, 3, 4, 3, 2, 3, 4, 5, 4, 3, 2, 3, 4, 3, 2, 1, 2, 3, 2, 1,
  ]);
});
