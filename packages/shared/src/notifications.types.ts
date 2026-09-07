/**
 * Socket.IO event carrying the recipient's unread notification count. Emitted
 * to a user's own room whenever their notifications change, so open clients can
 * update their badge without polling.
 */
export const NOTIFICATIONS_COUNT_EVENT = "notifications_count";

export const Notifications = {
  gameEnd: 1,
  newRound: 2,
  myMove: 3,
  seatChange: 4,
} as const;

export type NotificationType =
  (typeof Notifications)[keyof typeof Notifications];

export type GameSubscriptions = {
  [userId: string]: NotificationType[];
};

export type GameNotification =
  | {
      gameId: string;
      type: typeof Notifications.gameEnd;
      params: { result: string };
      read: boolean;
    }
  | {
      gameId: string;
      type: typeof Notifications.myMove;
      params: { round: number };
      read: boolean;
    }
  | {
      gameId: string;
      type: typeof Notifications.newRound;
      params: { round: number };
      read: boolean;
    }
  | {
      gameId: string;
      type: typeof Notifications.seatChange;
      params: { seat: number; user: string | undefined; didTakeSeat: boolean };
      read: boolean;
    };

/**
 * The parts of a browser PushSubscription the server needs in order to send a
 * message to it. Matches the shape of `PushSubscription.toJSON()`.
 */
export type PushSubscriptionJSON = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/** The JSON body the server encrypts into a push message. */
export type PushPayload = {
  title: string;
  body: string;
  gameId: string;
};
