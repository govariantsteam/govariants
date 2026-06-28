import { NotificationType } from "@govariants/shared";

export type DBGameNotification = {
  gameId: string;
  type: NotificationType;
  params?: unknown;
  read: boolean;
};

export type UserNotifications = {
  userId: string;
  notifications: DBGameNotification[];
};
