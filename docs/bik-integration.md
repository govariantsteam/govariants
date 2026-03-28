# BIK Integration Plan — govariants

BIK (Baduk InterKonnect) is a federation protocol for playing Go across servers.
This document covers what govariants needs to implement to join the federation,
and how to test it against frogs.cafe.

Full protocol spec: `bik/spec/protocol.md` in the frogs_cafe repo (or the PR).

---

## Roles

A BIK server can be a **host** (owns the game, runs the WebSocket) or a **guest**
(player is remote, connects to the host's WebSocket). For the initial integration,
govariants will act as a **guest** — a govariants user accepts a challenge from
frogs.cafe and connects to frogs.cafe's WebSocket to play.

Host role (govariants advertising challenges and hosting games) is a natural follow-on.

---

## What govariants needs to implement (guest role)

### 1. Identity — WebFinger endpoint

```
GET /.well-known/webfinger?resource=acct:alice@govariants.com
```

Response (Content-Type: `application/jrd+json`):
```json
{
  "subject": "acct:alice@govariants.com",
  "links": [{
    "rel": "self",
    "type": "application/activity+json",
    "href": "https://govariants.com/users/alice"
  }]
}
```

### 2. Public key endpoint

```
GET /.well-known/bik/keys
```

Returns a JWK Set with govariants' Ed25519 public key. Used by the host server
to verify BIK tokens issued by govariants.

```json
{
  "keys": [{
    "kty": "OKP",
    "crv": "Ed25519",
    "kid": "bik-1",
    "x": "<base64url public key>"
  }]
}
```

### 3. BIK token endpoint

```
POST /api/bik/token/:gameId?gameURI=<host-game-uri>
Authorization: Bearer <session token>
```

Issues a signed token so the govariants user can authenticate on the host's WebSocket.

**Important**: the `gameURI` query param must be used as-is in the token — it points
to the *host* server's game, not govariants. Do not construct the URI from govariants'
own base URL.

Token payload (Ed25519 signed):
```json
{
  "player": "https://govariants.com/users/alice",
  "game":   "https://frogs.cafe/games/42",
  "exp":    1234567890
}
```

Token format: `base64url(payload).base64url(signature)` (no header, Ed25519).

### 4. Accept-challenge UI flow

When a govariants user wants to accept a frogs.cafe challenge:

1. User pastes / clicks the challenge URI
2. govariants POSTs an AP `Accept` activity to the host's inbox:
   ```
   POST https://frogs.cafe/bik/inbox
   Content-Type: application/activity+json

   {
     "@context": "https://www.w3.org/ns/activitystreams",
     "type": "Accept",
     "actor": "https://govariants.com/users/alice",
     "object": "<challenge URI>"
   }
   ```
3. Host responds with a `Create` activity containing a `BikGame` attachment
   (game URL, WebSocket URL, player colors)
4. govariants stores the game info and redirects the user to play

### 5. WebSocket connection to host

Use the `bik-js` library (in the frogs_cafe repo under `bik/bik-js/`):

```ts
import { BikClient } from "bik-js";

const client = new BikClient(wsURL, bikToken, {
  onMessage: (msg) => { /* handle game_state, move_played, game_over, etc. */ },
  onReady: () => { /* game_state received, UI can render */ },
});
client.connect();

// Send a move
client.send({ type: "move", data: { pos: [col, row] } });

// Resign
client.send({ type: "resign", data: {} });
```

---

## Known gotchas (from frogs.cafe implementation)

### Token `gameURI` must come from the caller

The token endpoint must not construct the game URI from its own base URL.
The game lives on the *host* server. The client (browser/app) must pass the full
game URI as a query parameter:

```
POST /api/bik/token/42?gameURI=https://frogs.cafe/games/42
```

This was the root cause of the cross-server auth failure in the frogs.cafe E2E test.

### Token player field is a full URI, not a handle

The `player` field in the token payload should be the full actor URI
(`https://govariants.com/users/alice`), not the fediverse handle
(`@alice@govariants.com`). The host server parses it as a URI to extract the domain
for key lookup.

### `move_played` vs `move` (host role, for later)

If govariants later hosts games, the WebSocket server must broadcast `move_played`
(with `moveNumber`, `color`, `captures`, `nextToPlay`, `clock`) to all watchers —
not echo back the client's raw `move` message.

---

## Testing plan

### Phase 1 — unit tests (no network)

Use `bik-js` test utilities (mock WebSocket, mock HTTP) to verify:
- Token signing produces correct payload
- AP `Accept` activity is correctly formed
- `BikClient` handles `game_state`, `move_played`, `game_over`

### Phase 2 — govariants vs frogs.cafe (local dev)

Run frogs.cafe locally (`just run`) and govariants locally, then:

1. Register `alice` on frogs.cafe (`localhost:8080`)
2. Register `bob` on govariants (`localhost:5173` or wherever)
3. Alice creates a BIK challenge via frogs.cafe UI
4. Bob accepts via govariants (paste challenge URI)
5. Both play a game — verify moves appear on both sides
6. One player resigns — verify `game_over` on both

Requires govariants to be reachable by frogs.cafe for key fetching
(`/.well-known/bik/keys`). Use `ngrok` or similar if running behind NAT.

### Phase 3 — deployed test (frogs.cafe vs govariants staging)

Same flow against real deployments. This is the proof-of-life demo.

---

## TypeScript implementation notes

### Key management

Generate an Ed25519 key pair at server startup (or load from env):

```ts
import { generateKeyPairSync } from "crypto";

const { privateKey, publicKey } = generateKeyPairSync("ed25519");
```

Export public key as JWK for the `/.well-known/bik/keys` endpoint.

### Signing tokens

```ts
import { createSign } from "crypto";
import { Buffer } from "buffer";

function signBikToken(player: string, gameURI: string, privateKey: KeyObject): string {
  const payload = JSON.stringify({
    player,
    game: gameURI,
    exp: Math.floor(Date.now() / 1000) + 300, // 5 min
  });
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const sig = createSign("ed25519").update(payloadB64).sign(privateKey);
  return `${payloadB64}.${sig.toString("base64url")}`;
}
```

Alternatively, the `bik-js` library already has `Keys` utilities — consider
extracting those into a shared package if govariants adopts it directly.

---

## Open Questions

### User identity URLs

The doc assumes `/users/alice` but govariants currently identifies users by
MongoDB ObjectId (`/users/67a1b2c3...`). We don't want to leak internal IDs
into a federation protocol. Proposed approach: introduce `/bik/users/:username`
endpoints that resolve usernames to the data BIK needs (WebFinger, actor URI,
etc.), keeping them separate from the existing `/api/users/:userId` routes.

### Auth for BIK endpoints

govariants uses session auth + CSRF tokens on mutating API routes. BIK
introduces two categories of endpoint with different auth needs:

- **User-facing** (`POST /api/bik/token/:gameId`) — called by an authenticated
  govariants user to get a signed token. Should use existing session auth +
  CSRF, same as other mutating routes.
- **Server-facing** (`/.well-known/webfinger`, `/.well-known/bik/keys`) — called
  by remote servers to look up users and verify tokens. These must be public
  (no session auth). Need to consider rate limiting and abuse prevention.

The Accept activity (`POST` to the remote server's inbox) is an outbound
request from govariants, so auth is the remote server's concern — but we do
need to decide whether to sign it with HTTP Signatures or rely on the BIK
token mechanism.

### Raw WebSocket vs socket.io

govariants uses socket.io for all real-time communication, but `bik-js` uses
raw WebSocket. This is fine — the BIK WebSocket connection is to the *host*
server, not to govariants itself. It's a separate outbound connection that
doesn't need to go through our socket.io setup. If govariants later becomes a
BIK host, we'll need to decide whether to run a separate raw WS server
alongside socket.io or adapt the protocol.
