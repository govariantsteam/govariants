import { UpdateResult } from "mongodb";
import { notifications } from "../db";
import {
  Notifications,
  NotificationType,
  GameNotification,
  UserNotifications,
  GameSubscriptions,
} from "./notifications.types";

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
  notificationsToDelete: NotificationType[],
): Promise<UpdateResult<UserNotifications>> {
  return await notifications().updateMany(
    { userId: { $in: recipientIds } },
    {
      $pull: {
        notifications: {
          gameId: { $eq: gameNotification.gameId },
          type: { $in: notificationsToDelete },
        },
      },
      $push: { notifications: gameNotification },
    },
    { upsert: true },
  );
}

export async function notifyOfGameEnd(
  recipientIds: string[],
  gameId: string,
): Promise<UpdateResult<UserNotifications>> {
  const newNotification: GameNotification = {
    gameId: gameId,
    type: Notifications.gameEnd,
  };
  return await addGameNotification(recipientIds, newNotification, [
    Notifications.myMove,
    Notifications.newRound,
  ]);
}

export async function notifyOfNewRound(
  recipientIds: string[],
  gameId: string,
  round: number,
): Promise<UpdateResult<UserNotifications>> {
  const newNotification: GameNotification = {
    gameId: gameId,
    type: Notifications.newRound,
    params: { round: round },
  };
  return await addGameNotification(recipientIds, newNotification, [
    Notifications.myMove,
    Notifications.newRound,
  ]);
}

export async function notifyOfMyMove(
  recipientIds: string[],
  gameId: string,
  round: number,
): Promise<UpdateResult<UserNotifications>> {
  const newNotification: GameNotification = {
    gameId: gameId,
    type: Notifications.myMove,
    params: { round: round },
  };
  return await addGameNotification(recipientIds, newNotification, [
    Notifications.myMove,
    Notifications.newRound,
  ]);
}

export async function notifyOfSeatChange(
  recipientIds: string[],
  gameId: string,
  seat: number,
  user: string,
  didTakeSeat: boolean,
): Promise<UpdateResult<UserNotifications>> {
  const newNotification: GameNotification = {
    gameId: gameId,
    type: Notifications.seatChange,
    params: { seat: seat, user: user, didTakeSeat: didTakeSeat },
  };
  return await addGameNotification(recipientIds, newNotification, [
    Notifications.seatChange,
  ]);
}

export function getRecipientIDs(
  subscriptions: GameSubscriptions,
  type: NotificationType,
): string[] {
  const IDs = Object.keys(subscriptions);
  return IDs.filter((id) => subscriptions[id].includes(type));
}
