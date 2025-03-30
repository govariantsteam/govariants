/**
 * We allow variants to return a variety of types from nextToPlay.
 *
 * "required" players are required to play a move in the round.
 * "optional" players may make a move in the round, but are not required.
 * This is useful in Simultaneous variants when certain players have already made their move,
 * but can change their move before the round completes.
 *
 * number[] - interpreted as multiple required players.  This is mostly available for historical purposes.
 * number - only one player may make a move this round.  Useful for Sequential variants.
 */
export type NextToPlayType =
  | number
  | number[]
  | { required: number[]; optional: number[] };

/** Normalizes the data type returned by AbstractGame.nextToPlay for easier handling by downstream code */
export function normalizeNextToPlay(nextToPlay: NextToPlayType): {
  required: number[];
  optional: number[];
} {
  if (typeof nextToPlay === "number") {
    return { required: [nextToPlay], optional: [] };
  }
  if (Array.isArray(nextToPlay)) {
    return { required: nextToPlay, optional: [] };
  }
  return nextToPlay;
}
