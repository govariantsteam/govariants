import { GameResponse, UserResponse } from "@govariants/shared";

export const SEAT_TOPIC_RE = /^game\/([a-f0-9]{24})\/(\d+)$/;
export const USER_TOPIC_RE = /^user\//;

export function gameTopic(gameId: string): string {
  return `game/${gameId}`;
}

export function seatTopic(gameId: string, seat: number | string): string {
  return `game/${gameId}/${seat}`;
}

export function seatsTopic(gameId: string): string {
  return `game/${gameId}/seats`;
}

export function userNotificationsTopic(userId: string): string {
  return `user/${userId}/notifications`;
}

type GameLookup = (gameId: string) => Promise<GameResponse>;

/**
 * Validates whether a user is allowed to subscribe to a topic.
 * Returns null if allowed, or a rejection reason string if not.
 */
export async function validateSubscription(
  topic: string,
  user: UserResponse | undefined,
  getGame: GameLookup,
): Promise<string | null> {
  // User-scoped topics are joined server-side from the handshake session, which
  // is the only identity a socket cannot lie about. A client asking for one is
  // asking to read somebody else's notifications.
  if (USER_TOPIC_RE.test(topic)) {
    return "user topics are not client-subscribable";
  }

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

/**
 * Validates and joins the given topics. `topics` comes straight from the
 * client, so it may not actually be an array.
 */
export async function handleSubscribe(
  topics: unknown,
  user: UserResponse | undefined,
  getGame: GameLookup,
  join: (topic: string) => Promise<void>,
): Promise<void> {
  if (!Array.isArray(topics)) {
    return;
  }

  for (const topic of topics) {
    const rejection = await validateSubscription(topic, user, getGame);
    if (rejection) {
      console.warn(`Rejected subscription to ${topic}: ${rejection}`);
      continue;
    }

    await join(topic);
  }
}

/**
 * Leaves the given topics. `topics` comes straight from the client, so it
 * may not actually be an array.
 */
export async function handleUnsubscribe(
  topics: unknown,
  leave: (topic: string) => Promise<void>,
): Promise<void> {
  if (!Array.isArray(topics)) {
    return;
  }

  for (const topic of topics) {
    await leave(topic);
  }
}
