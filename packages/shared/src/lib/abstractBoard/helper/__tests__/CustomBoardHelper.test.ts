import { validateConfig } from "../CustomBoardHelper";

describe("validateConfig", () => {
  it("throws an error if config is not an object", () => {
    expect(() => validateConfig(null)).toThrow("'config' is not an object");
    expect(() => validateConfig(42)).toThrow("'config' is not an object");
    expect(() => validateConfig("string")).toThrow("'config' is not an object");
  });

  it("throws an error if config.type is not 'custom'", () => {
    expect(() => validateConfig({})).toThrow("'config.type' must be 'custom'");
    expect(() => validateConfig({ type: "invalid" })).toThrow(
      "'config.type' must be 'custom'",
    );
  });

  it("throws an error if 'coordinates' is missing", () => {
    expect(() => validateConfig({ type: "custom" })).toThrow(
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
