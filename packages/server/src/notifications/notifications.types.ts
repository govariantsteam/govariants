import { NotificationType } from "@ogfcommunity/variants-shared";

export type DBGameNotification = {
  gameId: string;
  type: NotificationType;
  params?: unknown;
};

export type UserNotifications = {
  userId: string;
  notifications: DBGameNotification[];
};

// TODO: On delete user, delete notifications.
