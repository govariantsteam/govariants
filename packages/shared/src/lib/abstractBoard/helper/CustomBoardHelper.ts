import { CustomBoardConfig } from "../boardFactory";

export function validateConfig(config: unknown): CustomBoardConfig {
  if (!(config instanceof Object)) {
    throw new Error("'config' is not an object");
  }

  if (!("type" in config) || config.type !== "custom") {
    throw new Error("'config.type' must be 'custom'");
  }

  if (!("coordinates" in config)) {
    throw new Error("no 'coordinates' in config");
  }
  if (!("adjacencyList" in config)) {
    throw new Error("no 'adjacencyList' in config");
  }

  if (!Array.isArray(config.coordinates)) {
    throw new Error("'coordinates' is not an Array");
  }
  if (!Array.isArray(config.adjacencyList)) {
    throw new Error("'adjacencyList' is not an Array");
  }

  if (config.coordinates.length !== config.adjacencyList.length) {
    throw new Error("'coordinates' and 'adjacencyList' must be the same size");
  }

  const numIntersections = config.coordinates.length;

  if (
    !config.coordinates.every(
      (val) =>
        Array.isArray(val) &&
        val.length === 2 &&
        Number.isFinite(val[0]) &&
        Number.isFinite(val[1]),
    )
  ) {
    // tbh we can probably get more specific in the error message
    throw new Error("'coordinates' is invalid");
  }

  if (
    !config.adjacencyList.every(
      (neighbors, idx) =>
        Array.isArray(neighbors) &&
        neighbors.every(
          (neighbor) =>
            Number.isInteger(neighbor) &&
            neighbor !== idx &&
            neighbor >= 0 &&
            neighbor < numIntersections,
        ),
    )
  ) {
    // tbh we can probably get more specific in the error message
    throw new Error("'adjacencyList' is invalid");
  }

  // type assertion because TypeScript still thinks the types of the
  // members is unknown
  return config as CustomBoardConfig;
}

export function getConfigWarning(config: CustomBoardConfig): string {
  // check adjacency list is undirected
  const adjacencyList = config.adjacencyList;
  for (let i = 0; i < adjacencyList.length; i++) {
    const neighbors = adjacencyList[i];
    for (const neighbor of neighbors) {
      if (!adjacencyList[neighbor].includes(i)) {
        return `Warning: adjacencyList has directed edge: ${i} -> ${neighbor}`;
      }
    }
  }

  return "";
}
