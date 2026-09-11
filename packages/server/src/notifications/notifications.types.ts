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

export type DBPushSubscription = {
  userId: string;
  /** The push service URL, unique per browser profile. */
  endpoint: string;
  keys: { p256dh: string; auth: string };
  createdAt: Date;
};
