/*
 * Service worker for browser push notifications.
 *
 * Lives in public/ rather than src/ so it is served from the site root: a
 * service worker may only control pages at or below its own path, and these
 * notifications need to cover the whole site.
 *
 * This worker deliberately does nothing else — no caching, no offline
 * behaviour — so that registering it cannot change how the app loads.
 */

self.addEventListener("install", () => {
  // Take over without waiting for existing tabs to close, so an updated worker
  // is handling pushes right after deploy.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  // The subscription is userVisibleOnly, which obliges us to show a
  // notification for every push we receive. Returning early on an unreadable
  // payload would break that contract — the browser then shows a generic
  // "site updated in the background" notice of its own, and repeatedly
  // failing to show one can cost us the subscription. So every path below
  // ends in showNotification.
  let payload = null;
  try {
    payload = event.data ? event.data.json() : null;
  } catch {
    payload = null;
  }

  const title = (payload && payload.title) || "Go Variants";
  const options = {
    body:
      (payload && payload.body) || "Something happened in one of your games.",
    icon: "/logo.svg",
    badge: "/logo.svg",
  };

  if (payload && payload.gameId) {
    // Notifications about the same game replace each other rather than
    // stacking up, so a game left running overnight is one notification.
    options.tag = payload.gameId;
    options.data = { gameId: payload.gameId };
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const gameId = event.notification.data && event.notification.data.gameId;
  const target = new URL(
    gameId ? `/game/${gameId}` : "/notifications",
    self.location.origin,
  ).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Prefer a tab already on the target page, then any tab of the site, so
      // clicking a notification does not pile up duplicate tabs.
      const exact = windows.find((client) => client.url === target);
      if (exact) {
        return exact.focus();
      }

      const sameOrigin = windows.find((client) =>
        client.url.startsWith(self.location.origin),
      );
      if (sameOrigin && "navigate" in sameOrigin) {
        const navigated = await sameOrigin.navigate(target);
        return navigated ? navigated.focus() : sameOrigin.focus();
      }

      return self.clients.openWindow(target);
    })(),
  );
});
