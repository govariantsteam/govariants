/**
 * Calculates minimum distances for all vertex pairs with the algorithm by Floyd and Warshall.
 * Time complexity O(n^3)
 *
 * Returns the matrix of minimum distances M (which can contain positive infinity
 * for disconnected graphs), i.e. M[i][j] is the minimum distance from
 * vertex i to vertex j.
 *
 * @param graph_adjacency - The vertex adjacency list as given by Graph.export.
 */
export function allPairsShortestPaths(graph_adjacency: number[][]): number[][] {
  const n = graph_adjacency.length;
  const distMatrix = graph_adjacency.map((neighbors, vertex_idx) =>
    graph_adjacency.map((_, idx) =>
      vertex_idx === idx
        ? 0
        : neighbors.includes(idx)
          ? 1
          : Number.POSITIVE_INFINITY,
    ),
  );

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

/**
 * Calculates the eccentricity for all vertices, which is the maximum distance
 * to another vertex.
 * Time complexity O(n^3)
 *
 * Returns an array A with A[i] being the eccentricity of vertex i.
 *
 * @param graph_adjacency - The vertex adjacency list as given by Graph.export.
 */
export function eccentricity(graph_adjacency: number[][]): number[] {
  return allPairsShortestPaths(graph_adjacency).map((vertex_adjacency) =>
    Math.max(...vertex_adjacency.filter((n) => Number.isFinite(n))),
  );
}

/**
 * Calculates the generalized pyramid values for all vertices.
 * Time complexity O(n^3)
 *
 * Returns an array A with A[i] being the generalized pyramid value of vertex i,
 * or A[i] = 1 when the number of vertices is > 1000.
 *
 * @param graph_adjacency - The vertex adjacency list as given by Graph.export.
 */
export function generalizedPyramid(graph_adjacency: number[][]): number[] {
  if (graph_adjacency.length > 1000) {
    console.warn(
      `did not compute all pairs shortest paths, because ${graph_adjacency.length} is too many vertices.`,
    );
    return graph_adjacency.map(() => 1);
  }

  const _eccentricity = eccentricity(graph_adjacency);
  const diameter = Math.max(..._eccentricity);
  return _eccentricity.map((e) => 1 + diameter - e);
}
