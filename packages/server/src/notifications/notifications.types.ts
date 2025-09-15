export const Notifications = {
  gameEnd: 1,
  newRound: 2,
  myMove: 3,
  seatChange: 4,
} as const;

export type NotificationType =
  (typeof Notifications)[keyof typeof Notifications];

export type DBGameNotification = {
  gameId: string;
  type: NotificationType;
  params?: unknown;
};

export type UserNotifications = {
  userId: string;
  notifications: DBGameNotification[];
};

export type GameNotification =
  | {
      gameId: string;
      type: typeof Notifications.gameEnd;
    }
  | {
      gameId: string;
      type: typeof Notifications.myMove;
      params: { round: number };
    }
  | {
      gameId: string;
      type: typeof Notifications.newRound;
      params: { round: number };
    }
  | {
      gameId: string;
      type: typeof Notifications.seatChange;
      params: { seat: number; user: string; didTakeSeat: boolean };
    };

export type GameSubscriptions = {
  [userId: string]: NotificationType[];
};
