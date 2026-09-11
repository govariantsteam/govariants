import { GameErrorResponse, GameInitialResponse } from "../api_types";
import {
  Notifications,
  NotificationType,
  PushSubscriptionJSON,
} from "../notifications.types";

export function isErrorResult(
  dto: GameInitialResponse | GameErrorResponse,
): dto is GameErrorResponse {
  const errorProperty: Exclude<
    keyof GameErrorResponse,
    keyof GameInitialResponse
  > = "errorMessage";
  return errorProperty in dto;
}

export function isNotificationTypeArray(
  test_object: unknown,
): test_object is NotificationType[] {
  return Array.isArray(test_object) && test_object.every(isNotificationType);
}

export function isNotificationType(
  test_object: unknown,
): test_object is NotificationType {
  const values: unknown[] = Object.values(Notifications);
  return values.includes(test_object);
}

export function isPushSubscriptionJSON(
  test_object: unknown,
): test_object is PushSubscriptionJSON {
  if (typeof test_object !== "object" || test_object === null) {
    return false;
  }
  const { endpoint, keys } = test_object as Record<string, unknown>;
  if (typeof endpoint !== "string" || !endpoint) {
    return false;
  }
  if (typeof keys !== "object" || keys === null) {
    return false;
  }
  const { p256dh, auth } = keys as Record<string, unknown>;
  return typeof p256dh === "string" && typeof auth === "string";
}
