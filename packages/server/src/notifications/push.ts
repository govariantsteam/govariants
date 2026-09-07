/**
 * Browser push delivery, alongside the in-app notifications in
 * ./notifications.ts. Both fan out from addGameNotification, so a user's
 * per-game subscription decides what is sent; push only decides where.
 *
 * Push needs a VAPID key pair, which identifies this server to the browsers'
 * push services. Generate one per deployment and keep it — new keys invalidate
 * every existing subscription:
 *
 *     yarn workspace @govariants/server exec web-push generate-vapid-keys
 *
 * Set the two halves as VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY, plus
 * VAPID_SUBJECT: a contact a push service operator can use to reach us about a
 * misbehaving sender. It must be a mailto: or https: URL — a bare email
 * address is rejected. With any of the three unset the server logs one warning
 * and skips push entirely, which is the normal state for a dev checkout.
 */
import webpush, { WebPushError } from "web-push";
import { pushSubscriptions } from "../db";
import {
  GameNotification,
  PushPayload,
  PushSubscriptionJSON,
  renderNotification,
  renderNotificationTitle,
} from "@govariants/shared";

// web-push keeps the VAPID details in module state, so they only need to be
// handed over once. `undefined` means we have not looked at the environment yet.
let configured: boolean | undefined = undefined;

/**
 * Push is optional: a deployment without VAPID keys still runs, it just never
 * delivers browser notifications. Configuration is therefore reported rather
 * than thrown, since sending happens on the move-submission path where a
 * missing key should not fail the move.
 */
function isConfigured(): boolean {
  if (configured !== undefined) {
    return configured;
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    console.warn(
      "Push notifications are disabled: set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT to enable them.",
    );
    configured = false;
    return configured;
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  } catch (error) {
    console.error(
      "Push notifications are disabled: invalid VAPID details",
      error,
    );
    configured = false;
  }

  return configured;
}

/**
 * The public half of the VAPID key pair, which the browser needs when it
 * creates a subscription. Null when push is not configured.
 */
export function getVapidPublicKey(): string | null {
  return isConfigured() ? (process.env.VAPID_PUBLIC_KEY ?? null) : null;
}

export async function savePushSubscription(
  userId: string,
  subscription: PushSubscriptionJSON,
): Promise<void> {
  // Rebuilt field by field rather than storing the request body as it arrived.
  // The route validates the shape, but the object can still carry properties we
  // never asked for, and this is the last point before the database: coercing
  // each field guarantees a string reaches the query filter, where a nested
  // object would otherwise be read as a query operator.
  const endpoint = String(subscription.endpoint);
  const keys = {
    p256dh: String(subscription.keys.p256dh),
    auth: String(subscription.keys.auth),
  };

  // Keyed on the endpoint rather than the user: a browser has exactly one
  // endpoint, so re-subscribing after a key rotation, or signing in as someone
  // else on the same browser, should replace the record instead of adding one.
  await pushSubscriptions().updateOne(
    { endpoint: endpoint },
    {
      $set: { userId: userId, keys: keys },
      $setOnInsert: { endpoint: endpoint, createdAt: new Date() },
    },
    { upsert: true },
  );
}

export async function deletePushSubscription(
  userId: string,
  endpoint: string,
): Promise<void> {
  await pushSubscriptions().deleteOne({ userId: userId, endpoint: endpoint });
}

export async function deleteAllPushSubscriptionsOfUser(
  userId: string,
): Promise<void> {
  await pushSubscriptions().deleteMany({ userId: userId });
}

export async function hasPushSubscription(
  userId: string,
  endpoint: string,
): Promise<boolean> {
  const existing = await pushSubscriptions().findOne({
    userId: userId,
    endpoint: endpoint,
  });
  return existing !== null;
}

/**
 * Deliver a notification to every browser the given users have subscribed.
 *
 * Failures are swallowed on purpose — this runs alongside the in-app
 * notification, which is the source of truth, so a push service being down
 * must not break gameplay.
 */
export async function sendPushNotification(
  userIds: string[],
  notification: GameNotification,
): Promise<void> {
  if (!userIds.length || !isConfigured()) {
    return;
  }

  const subscriptions = await pushSubscriptions()
    .find({ userId: { $in: userIds } })
    .toArray();

  if (!subscriptions.length) {
    return;
  }

  const payload: PushPayload = {
    title: renderNotificationTitle(notification),
    body: renderNotification(notification),
    gameId: notification.gameId,
  };
  const serialized = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: subscription.keys },
          serialized,
        );
      } catch (error) {
        // 404 and 410 mean the browser has dropped the subscription for good,
        // so retrying it later is pointless. Anything else may be transient.
        const statusCode =
          error instanceof WebPushError ? error.statusCode : undefined;
        if (statusCode === 404 || statusCode === 410) {
          await pushSubscriptions().deleteOne({
            endpoint: subscription.endpoint,
          });
        } else {
          console.error("Failed to send push notification:", error);
        }
      }
    }),
  );
}
