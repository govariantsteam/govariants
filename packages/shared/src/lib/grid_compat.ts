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

/**
 * Translate a move string to the two main indices:
 * SGF coordinate and numbers.
 */
export function moveToIndex(move: string): Coordinate | number {
  if (/^[A-Za-z]{2}$/.test(move)) {
    return Coordinate.fromSgfRepr(move);
  }
  return parseInt(move);
}
