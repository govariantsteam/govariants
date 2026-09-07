import { isNotificationTypeArray, isPushSubscriptionJSON } from "./type-guards";

export function validateNotificationTypeArray(test_object: unknown): void {
  if (!isNotificationTypeArray(test_object)) {
    throw new Error("notification type array failed validation");
  }
}

export function validatePushSubscription(test_object: unknown): void {
  if (!isPushSubscriptionJSON(test_object)) {
    throw new Error("push subscription failed validation");
  }
}
