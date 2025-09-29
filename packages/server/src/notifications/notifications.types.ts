import { Notifications, NotificationType } from "@ogfcommunity/variants-shared";

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

// TODO: On delete user, delete notifications.
