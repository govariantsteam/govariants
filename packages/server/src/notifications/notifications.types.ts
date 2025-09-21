import {
  Notifications,
  NotificationType,
} from "../../../shared/dist/notifications.types";
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
