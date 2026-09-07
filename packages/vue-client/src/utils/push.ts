import * as requests from "@/requests";

const SERVICE_WORKER_URL = "/sw.js";

export type PushState =
  /** The browser has no Push API (Safari before 16.4, most in-app browsers). */
  | "unsupported"
  /** This deployment has no VAPID keys, so push is turned off site-wide. */
  | "unavailable"
  /** The user blocked notifications; only browser settings can undo this. */
  | "denied"
  /** Available and not blocked, but this browser is not subscribed. */
  | "disabled"
  /** This browser is subscribed and the server knows about it. */
  | "enabled";

export function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * VAPID keys travel as base64url text, but PushManager.subscribe wants the raw
 * bytes.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

async function getPublicKey(): Promise<string | null> {
  const { publicKey } = await requests.get("/notifications/push/key");
  return publicKey ?? null;
}

async function getExistingSubscription(): Promise<PushSubscription | null> {
  const registration =
    await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL);
  return (await registration?.pushManager.getSubscription()) ?? null;
}

/**
 * A subscription created against a different VAPID key cannot decrypt messages
 * signed with the current one, so a key rotation has to be noticed here rather
 * than showing up as notifications that silently never arrive.
 */
function matchesPublicKey(
  subscription: PushSubscription,
  publicKey: string,
): boolean {
  const existing = subscription.options.applicationServerKey;
  if (!existing) {
    return false;
  }
  const current = new Uint8Array(existing);
  const wanted = urlBase64ToUint8Array(publicKey);
  return (
    current.length === wanted.length &&
    current.every((byte, index) => byte === wanted[index])
  );
}

export async function getPushState(): Promise<PushState> {
  if (!isPushSupported()) {
    return "unsupported";
  }
  if (!(await getPublicKey())) {
    return "unavailable";
  }
  if (Notification.permission === "denied") {
    return "denied";
  }

  const subscription = await getExistingSubscription();
  if (!subscription) {
    return "disabled";
  }

  // The browser can hold a subscription the server has no record of — after a
  // user was deleted, say — so the server has the final say on the state.
  const { subscribed } = await requests.post("/notifications/push/status", {
    endpoint: subscription.endpoint,
  });
  return subscribed ? "enabled" : "disabled";
}

/**
 * Ask for notification permission and register this browser with the server.
 *
 * Must be called from a user gesture: browsers reject (and Chrome permanently
 * blocks) permission prompts that a click did not trigger.
 */
export async function enablePush(): Promise<PushState> {
  if (!isPushSupported()) {
    return "unsupported";
  }

  const publicKey = await getPublicKey();
  if (!publicKey) {
    return "unavailable";
  }

  const permission = await Notification.requestPermission();
  if (permission === "denied") {
    return "denied";
  }
  if (permission !== "granted") {
    // "default" — the user dismissed the prompt without answering.
    return "disabled";
  }

  const registration = await navigator.serviceWorker.register(
    SERVICE_WORKER_URL,
  );
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (subscription && !matchesPublicKey(subscription, publicKey)) {
    await subscription.unsubscribe();
    subscription = null;
  }
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await requests.post("/notifications/push/subscribe", {
    subscription: subscription.toJSON(),
  });

  return "enabled";
}

export async function disablePush(): Promise<PushState> {
  if (!isPushSupported()) {
    return "unsupported";
  }

  const subscription = await getExistingSubscription();
  if (subscription) {
    // Drop the server's record first. If this succeeded but the local
    // unsubscribe failed we would merely have a subscription nothing sends to;
    // the other order leaves the server pushing into the void.
    await requests.post("/notifications/push/unsubscribe", {
      endpoint: subscription.endpoint,
    });
    await subscription.unsubscribe();
  }

  return Notification.permission === "denied" ? "denied" : "disabled";
}
