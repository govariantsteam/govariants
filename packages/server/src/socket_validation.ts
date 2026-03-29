import { UserResponse } from "@ogfcommunity/variants-shared";
import { getGame } from "./games";

export const SEAT_TOPIC_RE = /^game\/([a-f0-9]{24})\/(\d+)$/;

/**
 * Validates whether a user is allowed to subscribe to a seat-specific topic.
 * Returns null if allowed, or a rejection reason string if not.
 */
export async function validateSeatSubscription(
  topic: string,
  user: UserResponse | undefined,
): Promise<string | null> {
  const match = topic.match(SEAT_TOPIC_RE);
  if (!match) return null; // Not a seat topic, always allowed

  const [, gameId, seatStr] = match;
  const seat = Number(seatStr);

  if (!user) {
    return "no authenticated user";
  }

  try {
    const game = await getGame(gameId);
    const occupant = game.players?.[seat];
    if (!occupant || occupant.id !== user.id) {
      return `user ${user.id} does not occupy seat ${seat}`;
    }
  } catch {
    return "game not found";
  }

  return null;
}
