import { GameErrorResponse, GameInitialResponse } from "../api_types";
import { Notifications, NotificationType } from "../notifications.types";

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
