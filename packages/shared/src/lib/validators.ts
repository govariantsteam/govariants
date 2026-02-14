import { isNotificationTypeArray } from "./type-guards";

export function validateNotificationTypeArray(test_object: unknown): void {
  if (!isNotificationTypeArray(test_object)) {
    throw new Error("notification type array failed validation");
  }
}
