import { Coordinate } from "@ogfcommunity/variants-shared";
import type { Ref } from "vue";

/** Given Refs for width and height, return a flat array of coordinates containing
 * all coordinates in a grid */
export function positionsGetter(width: Ref<number>, height: Ref<number>) {
  return () =>
    new Array(height.value * width.value)
      .fill(null)
      .map(
        (_, index) =>
          new Coordinate(index % width.value, Math.floor(index / width.value)),
      );
}
