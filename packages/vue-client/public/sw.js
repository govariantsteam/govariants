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
  if (!event.data) {
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/logo.svg",
      badge: "/logo.svg",
      // Notifications about the same game replace each other rather than
      // stacking up, so a game left running overnight is one notification.
      tag: payload.gameId,
      data: { gameId: payload.gameId },
    }),
  );
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
