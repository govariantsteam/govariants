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
