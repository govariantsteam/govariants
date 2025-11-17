import { UpdateResult } from "mongodb";
import { notifications } from "../db";
import { UserNotifications } from "./notifications.types";
import {
  GameNotification,
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

export async function getUserNotificationsCount(
  userId: string,
): Promise<number> {
  const queryResult = await notifications()
    .aggregate([
      { $match: { userId: userId } },
      { $project: { num: { $size: "$notifications" } } },
    ])
    .toArray();

  return queryResult.at(0)?.num ?? 0;
}

async function addGameNotification(
  recipientIds: string[],
  gameNotification: GameNotification,
): Promise<UpdateResult<UserNotifications>> {
  if (!recipientIds.length) return;

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
  if (!userIds.length || !types.length) return;

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
  nextToPlayIds: string[],
): Promise<UpdateResult<UserNotifications>> {
  await deleteGameNotifications(getSubscriberIds(subscriptions), gameId, [
    Notifications.myMove,
    Notifications.newRound,
  ]);

  const newRoundNotification: GameNotification = {
    gameId: gameId,
    type: Notifications.newRound,
    params: { round: round },
  };
  const myMoveNotification: GameNotification = {
    gameId: gameId,
    type: Notifications.myMove,
    params: { round: round },
  };
  await addGameNotification(
    getRecipientIDs(subscriptions, Notifications.myMove).filter((id) =>
      nextToPlayIds.includes(id),
    ),
    myMoveNotification,
  );
  return await addGameNotification(
    getRecipientIDs(subscriptions, Notifications.newRound),
    newRoundNotification,
  );
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
