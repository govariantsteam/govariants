import { SerializedGraph } from "./graph";

/**
 * Calculates minimum distances for all vertex pairs with the algorithm by Floyd and Warshall.
 * Time complexity O(n^3)
 *
 * @param graph_adjacency - The graph adjacency list as given by Graph.export.
 * Returns the matrix of minimum distances (which can contain positive infinity
 * for disconnected graphs). DistMatrix[i][j] gives the minimum distance from
 * vertex i to vertex j.
 */
export function allPairsShortestPaths(
  graph_adjacency: SerializedGraph<unknown>["adjacency_array"],
): number[][] {
  const n = graph_adjacency.length;
  const distMatrix = graph_adjacency.map((neighbors) =>
    graph_adjacency.map((_, idx) =>
      neighbors.includes(idx) ? 1 : Number.POSITIVE_INFINITY,
    ),
  );

  // if (n > 1000) {
  //   console.warn(
  //     `did not compute all pairs shortest paths, because ${n} is too many vertices.`,
  //   );
  //   return graph_adjacency.map(_ => graph_adjacency.map(_ => 1));
  // }

  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      for (let k = 0; k < n; k++) {
        distMatrix[j][k] = Math.min(
          distMatrix[j][k],
          distMatrix[j][i] + distMatrix[i][k],
        );
      }

  return distMatrix;
}
