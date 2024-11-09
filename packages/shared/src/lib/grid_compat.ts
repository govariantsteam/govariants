import { Coordinate, CoordinateLike } from "./coordinate";

/**
 * A collection of functions used for simpler code when both Grid and
 * Graph boards need to be handled.
 */

/** Returns the default move representation of an index type.
 * For coordinates, this is the SGF representation.
 */
export function indexToMove(index: CoordinateLike | number): string {
  if (typeof index === "number") {
    return index.toString();
  }
  return new Coordinate(index.x, index.y).toSgfRepr();
}
