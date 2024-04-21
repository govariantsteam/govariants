import { Coordinate } from "@ogfcommunity/variants-shared";
import type { Ref } from "vue";

export function positionsGetter(width: Ref<number>, height: Ref<number>) {
  return () =>
    new Array(height.value * width.value)
      .fill(null)
      .map(
        (_, index) =>
          new Coordinate(index % width.value, Math.floor(index / width.value)),
      );
}
