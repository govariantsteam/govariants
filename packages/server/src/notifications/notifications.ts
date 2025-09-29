import { UpdateResult } from "mongodb";
import { notifications } from "../db";
import { GameNotification, UserNotifications } from "./notifications.types";
import {
  GameSubscriptions,
  Notifications,
  NotificationType,
} from "@ogfcommunity/variants-shared";

function outwardMap(userNotifications: UserNotifications): GameNotification[] {
  return userNotifications.notifications as GameNotification[];
}

export async function getUserNotifications(
  userId: string,
): Promise<GameNotification[]> {
  return outwardMap(await notifications().findOne({ userId: userId }));
}

async function addGameNotification(
  recipientIds: string[],
  gameNotification: GameNotification,
): Promise<UpdateResult<UserNotifications>> {
  return await notifications().updateMany(
    { userId: { $in: recipientIds } },
    {
      $push: { notifications: gameNotification },
    },
    { upsert: true },
  );
}

async function deleteGameNotifications(
  userIds: string[],
  gameId: string,
  types: NotificationType[],
): Promise<UpdateResult<UserNotifications>> {
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

async function addAndDeleteGameNotifications(
  recipientIds: string[],
  gameNotificationToAdd: GameNotification,
  notificationTypesToDelete: NotificationType[],
): Promise<UpdateResult<UserNotifications>> {
  return await notifications().updateMany(
    { userId: { $in: recipientIds } },
    {
      $pull: {
        notifications: {
          gameId: { $eq: gameNotificationToAdd.gameId },
          type: { $in: notificationTypesToDelete },
        },
      },
      $push: { notifications: gameNotificationToAdd },
    },
    { upsert: true },
  );
}

export async function notifyOfGameEnd(
  subscriptions: GameSubscriptions,
  gameId: string,
  gameResult: string,
): Promise<UpdateResult<UserNotifications>> {
  await deleteGameNotifications(getSubscriberIds(subscriptions), gameId, [
    Notifications.myMove,
    Notifications.newRound,
  ]);

  const newNotification: GameNotification = {
    gameId: gameId,
    type: Notifications.gameEnd,
    params: { result: gameResult },
  };
  return await addGameNotification(
    getRecipientIDs(subscriptions, Notifications.gameEnd),
    newNotification,
  );
}

export async function notifyOfNewRound(
  subscriptions: GameSubscriptions,
  gameId: string,
  round: number,
): Promise<UpdateResult<UserNotifications>> {
  await deleteGameNotifications(getSubscriberIds(subscriptions), gameId, [
    Notifications.myMove,
    Notifications.newRound,
  ]);

  const newNotification: GameNotification = {
    gameId: gameId,
    type: Notifications.newRound,
    params: { round: round },
  };
  return await addGameNotification(
    getRecipientIDs(subscriptions, Notifications.newRound),
    newNotification,
  );
}

export async function notifyOfMyMove(
  subscriptions: GameSubscriptions,
  nextToPlayIds: string[],
  gameId: string,
  round: number,
): Promise<UpdateResult<UserNotifications>> {
  const newNotification: GameNotification = {
    gameId: gameId,
    type: Notifications.myMove,
    params: { round: round },
  };
  const recipientIds = getRecipientIDs(
    subscriptions,
    Notifications.myMove,
  ).filter((x) => nextToPlayIds.includes(x));
  // TODO: think about this, since new round and my move are coupled - what will happen after the add & remove stuff of both?
  return await addAndDeleteGameNotifications(recipientIds, newNotification, [
    Notifications.myMove,
    Notifications.newRound,
  ]);
}

export async function notifyOfSeatChange(
  subscriptions: GameSubscriptions,
  gameId: string,
  seat: number,
  user: string | undefined,
  didTakeSeat: boolean,
): Promise<UpdateResult<UserNotifications>> {
  const newNotification: GameNotification = {
    gameId: gameId,
    type: Notifications.seatChange,
    params: { seat: seat, user: user, didTakeSeat: didTakeSeat },
  };
  return await addGameNotification(
    getRecipientIDs(subscriptions, Notifications.seatChange),
    newNotification,
  );
}

function getRecipientIDs(
  subscriptions: GameSubscriptions,
  type: NotificationType,
): string[] {
  const IDs = Object.keys(subscriptions);
  return IDs.filter((id) => subscriptions[id].includes(type));
}

function getSubscriberIds(subscriptions: GameSubscriptions): string[] {
  return Object.keys(subscriptions);
}
