import { CustomBoardConfig } from "../../boardFactory";
import { getConfigWarning, validateConfig } from "../CustomBoardHelper";

describe("validateConfig", () => {
  it("throws an error if config is not an object", () => {
    expect(() => validateConfig(null)).toThrow("'config' is not an object");
    expect(() => validateConfig(42)).toThrow("'config' is not an object");
    expect(() => validateConfig("string")).toThrow("'config' is not an object");
  });

  it("throws an error if config.type is not 'custom'", () => {
    expect(() =>
      validateConfig({
        adjacencyList: [],
        coordinates: [],
      }),
    ).toThrow("'config.type' must be 'custom'");
    expect(() => validateConfig({ type: "invalid" })).toThrow(
      "'config.type' must be 'custom'",
    );
  });

  it("throws an error if 'coordinates' is missing", () => {
    expect(() => validateConfig({ type: "custom", adjacencyList: [] })).toThrow(
      "no 'coordinates' in config",
    );
  });

  it("throws an error if 'adjacencyList' is missing", () => {
    expect(() => validateConfig({ type: "custom", coordinates: [] })).toThrow(
      "no 'adjacencyList' in config",
    );
  });

  it("throws an error if 'coordinates' is not an array", () => {
    expect(() =>
      validateConfig({ type: "custom", coordinates: {}, adjacencyList: [] }),
    ).toThrow("'coordinates' is not an Array");
  });

  it("throws an error if 'adjacencyList' is not an array", () => {
    expect(() =>
      validateConfig({ type: "custom", coordinates: [], adjacencyList: {} }),
    ).toThrow("'adjacencyList' is not an Array");
  });

  it("throws an error if 'coordinates' and 'adjacencyList' are not the same size", () => {
    expect(() =>
      validateConfig({
        type: "custom",
        coordinates: [[0, 0]],
        adjacencyList: [],
      }),
    ).toThrow("'coordinates' and 'adjacencyList' must be the same size");
  });

  it("throws an error if 'coordinates' contains invalid entries", () => {
    expect(() =>
      validateConfig({
        type: "custom",
        coordinates: [[0, 0], [1]],
        adjacencyList: [[], []],
      }),
    ).toThrow("'coordinates' is invalid");
  });

  it("throws an error if 'adjacencyList' contains invalid entries", () => {
    expect(() =>
      validateConfig({
        type: "custom",
        coordinates: [
          [0, 0],
          [1, 1],
        ],
        adjacencyList: [[1], [2]],
      }),
    ).toThrow("'adjacencyList' is invalid");
  });

  it("returns the config if it is valid", () => {
    const validConfig = {
      type: "custom",
      coordinates: [
        [0, 0],
        [1, 1],
      ],
      adjacencyList: [[1], [0]],
    };
    expect(validateConfig(validConfig)).toBe(validConfig);
  });
});

describe("getConfigWarning", () => {
  it("returns an empty string for a valid config", () => {
    const validConfig: CustomBoardConfig = {
      type: "custom",
      coordinates: [
        [0, 0],
        [1, 1],
      ],
      adjacencyList: [[1], [0]],
    };
    expect(getConfigWarning(validConfig)).toBe("");
  });
  it("returns a warning for a config with directed edges", () => {
    const configWithDirectedEdges: CustomBoardConfig = {
      type: "custom",
      coordinates: [
        [0, 0],
        [1, 1],
      ],
      adjacencyList: [[1], []], // Directed edges
    };
    expect(getConfigWarning(configWithDirectedEdges)).toBe(
      "Warning: 'adjacencyList' has directed edge: 0 -> 1",
    );
  });
  it("returns a warning for a config with duplicate coordinates", () => {
    const configWithDuplicates: CustomBoardConfig = {
      type: "custom",
      coordinates: [
        [0, 0],
        [1, 1],
        [0, 0], // Duplicate
      ],
      adjacencyList: [[], [], []],
    };
    expect(getConfigWarning(configWithDuplicates)).toBe(
      "Warning: 'coordinates' contains duplicate: (0,0)",
    );
  });
});
