import { UpdateResult } from "mongodb";
import { notifications } from "../db";
import { UserNotifications } from "./notifications.types";
import {
  GameNotification,
  GameSubscriptions,
  NOTIFICATIONS_COUNT_EVENT,
  Notifications,
  NotificationType,
} from "@govariants/shared";
import { io } from "../socket_io";
import { userNotificationsTopic } from "../socket_validation";

function outwardMap(userNotifications: UserNotifications): GameNotification[] {
  return userNotifications.notifications as GameNotification[];
}

export async function initUserNotifications(userId: string): Promise<void> {
  await notifications().updateOne(
    { userId: userId },
    {
      $setOnInsert: {
        userId: userId,
        notifications: [],
      },
    },
    { upsert: true },
  );
}

export async function getUserNotifications(
  userId: string,
): Promise<GameNotification[]> {
  const userNotifications = await notifications().findOne({ userId: userId });
  return userNotifications ? outwardMap(userNotifications) : [];
}

export async function getUserNotificationsCount(
  userId: string,
): Promise<number> {
  return (await getUserNotificationsCounts([userId])).get(userId) ?? 0;
}

/**
 * Unread count per user, keyed by id. Users without a notifications document
 * are reported as zero rather than omitted.
 */
async function getUserNotificationsCounts(
  userIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map(userIds.map((userId) => [userId, 0]));
  if (!counts.size) return counts;

  const queryResult = await notifications()
    .aggregate([
      { $match: { userId: { $in: [...counts.keys()] } } },
      {
        $project: {
          userId: 1,
          num: {
            $size: {
              $filter: {
                input: "$notifications",
                as: "notification",
                cond: { $eq: ["$$notification.read", false] },
              },
            },
          },
        },
      },
    ])
    .toArray();

  for (const { userId, num } of queryResult) {
    counts.set(userId, num);
  }

  return counts;
}

/**
 * Pushes each user's unread count to their own room, so that clients already on
 * the site update their badge instead of showing the count they loaded with.
 */
async function emitNotificationsCounts(userIds: string[]): Promise<void> {
  const counts = await getUserNotificationsCounts(userIds);
  for (const [userId, count] of counts) {
    io()
      .to(userNotificationsTopic(userId))
      .emit(NOTIFICATIONS_COUNT_EVENT, count);
  }
}

async function addGameNotification(
  recipientIds: string[],
  gameNotification: GameNotification,
): Promise<UpdateResult<UserNotifications> | undefined> {
  if (!recipientIds.length) return undefined;

  return await notifications().updateMany(
    { userId: { $in: recipientIds } },
    {
      $push: { notifications: gameNotification },
    },
  );
}

async function deleteGameNotifications(
  userIds: string[],
  gameId: string,
  types: NotificationType[],
): Promise<UpdateResult<UserNotifications> | undefined> {
  if (!userIds.length || !types.length) return undefined;

  return await notifications().updateMany(
    { userId: { $in: userIds } },
    {
      $pull: {
        notifications: {
          gameId: { $eq: gameId },
          type: { $in: types },
        },
      },
    },
  );
}

export async function notifyOfGameEnd(
  subscriptions: GameSubscriptions,
  gameId: string,
  gameResult: string,
): Promise<void> {
  const subscriberIds = getSubscriberIds(subscriptions);
  await deleteGameNotifications(subscriberIds, gameId, [
    Notifications.myMove,
    Notifications.newRound,
  ]);

  const newNotification: GameNotification = {
    gameId: gameId,
    type: Notifications.gameEnd,
    params: { result: gameResult },
    read: false,
  };
  await addGameNotification(
    getRecipientIDs(subscriptions, Notifications.gameEnd),
    newNotification,
  );

  await emitNotificationsCounts(subscriberIds);
}

export async function notifyOfNewRound(
  subscriptions: GameSubscriptions,
  gameId: string,
  round: number,
  nextToPlayIds: string[],
): Promise<void> {
  const subscriberIds = getSubscriberIds(subscriptions);
  await deleteGameNotifications(subscriberIds, gameId, [
    Notifications.myMove,
    Notifications.newRound,
  ]);

  const newRoundNotification: GameNotification = {
    gameId: gameId,
    type: Notifications.newRound,
    params: { round: round },
    read: false,
  };
  const myMoveNotification: GameNotification = {
    gameId: gameId,
    type: Notifications.myMove,
    params: { round: round },
    read: false,
  };
  await addGameNotification(
    getRecipientIDs(subscriptions, Notifications.myMove).filter((id) =>
      nextToPlayIds.includes(id),
    ),
    myMoveNotification,
  );
  await addGameNotification(
    getRecipientIDs(subscriptions, Notifications.newRound),
    newRoundNotification,
  );

  await emitNotificationsCounts(subscriberIds);
}

export async function notifyOfSeatChange(
  subscriptions: GameSubscriptions,
  gameId: string,
  seat: number,
  user: string | undefined,
  didTakeSeat: boolean,
): Promise<void> {
  const newNotification: GameNotification = {
    gameId: gameId,
    type: Notifications.seatChange,
    params: { seat: seat, user: user, didTakeSeat: didTakeSeat },
    read: false,
  };
  const recipientIds = getRecipientIDs(subscriptions, Notifications.seatChange);
  await addGameNotification(recipientIds, newNotification);

  await emitNotificationsCounts(recipientIds);
}

export async function markAsRead(
  userId: string,
  gameId: string,
): Promise<void> {
  await notifications().updateOne(
    { userId: userId },
    { $set: { "notifications.$[notification].read": true } },
    { arrayFilters: [{ "notification.gameId": gameId }] },
  );

  await emitNotificationsCounts([userId]);
}

export async function clearNotifications(
  userId: string,
  gameId: string,
): Promise<void> {
  await notifications().updateOne(
    { userId: userId },
    { $pull: { notifications: { gameId: gameId } } },
  );

  await emitNotificationsCounts([userId]);
}

export async function deleteAllNotificationsOfUser(
  userId: string,
): Promise<void> {
  await notifications().deleteOne({ userId: userId });
}

function getRecipientIDs(
  subscriptions: GameSubscriptions,
  type: NotificationType,
): string[] {
  const ids = Object.keys(subscriptions);
  return ids.filter((id) => subscriptions[id].includes(type));
}

function getSubscriberIds(subscriptions: GameSubscriptions): string[] {
  return Object.keys(subscriptions);
}
