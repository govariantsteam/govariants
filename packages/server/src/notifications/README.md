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

Push is off until it is configured, so a fresh checkout needs these steps once.

### 1. Generate a VAPID key pair

[VAPID](https://datatracker.ietf.org/doc/html/rfc8292) is how a push service
(Google's, Mozilla's, Apple's) knows a message really came from this server. The
key pair identifies the _server_, not a user. Generate one per deployment and
keep reusing it — generating new keys on every boot would invalidate everyone's
subscriptions.

From the repository root, this prints the two lines ready to paste:

```sh
node -e "const k=require('web-push').generateVAPIDKeys();console.log('VAPID_PUBLIC_KEY='+k.publicKey);console.log('VAPID_PRIVATE_KEY='+k.privateKey)"
```

```
VAPID_PUBLIC_KEY=BJ-dUCpgIqkajCzFD2WPGXTJqJS455Phsm...   # 87 chars
VAPID_PRIVATE_KEY=bSxNnF8b_6zxCE85A3yfs2EeA5tjSVqv...   # 43 chars
```

`web-push` also ships a CLI, if you prefer its labelled output:

```sh
yarn workspace @govariants/server exec web-push generate-vapid-keys
```

### 2. Set three environment variables

| Variable            | Required | Description                                             | Example                       |
| ------------------- | -------- | ------------------------------------------------------- | ----------------------------- |
| `VAPID_PUBLIC_KEY`  | Yes      | Public half; the server hands it to the browser         | `BJ-dUCpg...`                 |
| `VAPID_PRIVATE_KEY` | Yes      | Private half; secret, never commit it                   | `bSxNnF8b...`                 |
| `VAPID_SUBJECT`     | Yes      | Contact for the push service; `mailto:` or `https:` URL | `mailto:admin@govariants.com` |

`VAPID_SUBJECT` must be a `mailto:` or `https:` URL — a bare email address is
rejected, and push stays off with an error in the log. It exists so a push
service operator can get in touch about a misbehaving sender.

There is no `.env` loading in this project, so for local development export the
variables in the shell you start the server from:

```sh
export VAPID_PUBLIC_KEY=BJ-dUCpg...
export VAPID_PRIVATE_KEY=bSxNnF8b...
export VAPID_SUBJECT=mailto:you@example.com
yarn start
```

In production set them wherever the deployment keeps its config; on Heroku that
is `heroku config:set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=...`.

Only the server needs configuring. The client fetches the public key from
`/api/notifications/push/key` at runtime, so there is nothing to set at build
time and nothing to rebuild when the keys change.

### Behaviour when unconfigured or rotated

With any of the three unset the server logs one warning at first use and skips
push entirely; the client hides the opt-in, and in-app notifications carry on as
before. This is the normal state for a dev checkout that has not opted in.

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
