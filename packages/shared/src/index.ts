export * from "./variants/baduk";
export * from "./variants/phantom";
export * from "./variants/capture";
export * from "./variants/parallel";
export * from "./variants/quantum";
export * from "./abstract_game";
export * from "./variant_map";
export * from "./api_types";
export * from "./lib/grid";
export * from "./lib/coordinate";
export * from "./time_control";
export * from "./lib/utils";
export * from "./lib/hoshi";
export { type FreezeGoState } from "./variants/freeze";
export {
  type Color as FractionalColor,
  Fractional,
  type FractionalConfig,
  type FractionalState,
} from "./variants/fractional";
export { type KeimaState } from "./variants/keima";
export * from "./variants/drift";
export * from "./variants/baduk_utils";
export * from "./lib/abstractBoard/boardFactory";
export * from "./lib/abstractBoard/intersection";
export * from "./variants/s_fractional";
export { count_binary_ones } from "./variants/thue_morse";
export { sFractionalMoveColors } from "./variants/s_fractional";

export const SITE_NAME = "Go Variants";
