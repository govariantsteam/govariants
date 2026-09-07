# Notifications Module

Two delivery channels share one set of per-game subscriptions:

- **In-app** (`notifications.ts`) — stored in Mongo and read by the
  notifications page. This is the source of truth.
- **Web push** (`push.ts`) — a browser notification, delivered even when the
  site is closed. Best-effort: a push that fails is logged and dropped, never
  retried, and never fails the move that triggered it.

Both fan out from `addGameNotification`, so subscribing to a game's
notifications is all a user chooses; push simply mirrors whatever they picked.

## Push setup

Push needs a [VAPID](https://datatracker.ietf.org/doc/html/rfc8292) key pair,
which identifies this server to the browsers' push services. Generate one:

```
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

Then configure:

| Variable            | Required | Description                                             | Example                       |
| ------------------- | -------- | ------------------------------------------------------- | ----------------------------- |
| `VAPID_PUBLIC_KEY`  | Yes      | Public half of the key pair, sent to the browser        | `BG3wqss...`                  |
| `VAPID_PRIVATE_KEY` | Yes      | Private half; keep it secret                            | `81sgMh7...`                  |
| `VAPID_SUBJECT`     | Yes      | Contact for the push service; `mailto:` or `https:` URL | `mailto:admin@govariants.com` |

With any of them unset the server logs one warning and skips push entirely; the
client hides the opt-in, and in-app notifications carry on as before.

Rotating the keys invalidates existing subscriptions. The client notices that
its stored subscription was made against a different public key and re-subscribes
on the next visit to the notifications page, so no manual cleanup is needed —
stale rows are pruned when the push service rejects them with 404 or 410.

## Storage

`push_subscriptions` holds one document per browser, keyed on the push
`endpoint` (unique index). A row is removed when the user turns notifications
off, deletes their account, or the push service reports the endpoint as gone.

## Client

The browser half lives in `vue-client`:

- `public/sw.js` — the service worker that shows the notification and handles
  clicks. It is served from the site root because a service worker can only
  control pages at or below its own path.
- `src/utils/push.ts` — permission prompt, subscribe/unsubscribe, state.
- `src/components/PushNotificationToggle.vue` — the opt-in, shown on the
  notifications page.

Browsers only allow the permission prompt in response to a user gesture, which
is why the opt-in is a button rather than something that happens on load.
