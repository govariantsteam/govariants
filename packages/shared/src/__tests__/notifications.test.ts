import { renderNotification, renderNotificationTitle } from "../notifications";
import { GameNotification, Notifications } from "../notifications.types";
import { isPushSubscriptionJSON } from "../lib/type-guards";
import { validatePushSubscription } from "../lib/validators";

const GAME_ID = "507f1f77bcf86cd799439011";

test.each([
  [
    {
      gameId: GAME_ID,
      type: Notifications.gameEnd,
      params: { result: "B+3.5" },
      read: false,
    },
    "Game over",
    "Game has ended with result B+3.5.",
  ],
  [
    {
      gameId: GAME_ID,
      type: Notifications.myMove,
      params: { round: 7 },
      read: false,
    },
    "Your move",
    "It's your move in round 7.",
  ],
  [
    {
      gameId: GAME_ID,
      type: Notifications.newRound,
      params: { round: 2 },
      read: false,
    },
    "New round",
    "Round 2 has started.",
  ],
  [
    {
      gameId: GAME_ID,
      type: Notifications.seatChange,
      params: { seat: 1, user: "someone", didTakeSeat: true },
      read: false,
    },
    "Seat change",
    "someone has taken seat 1.",
  ],
  [
    {
      gameId: GAME_ID,
      type: Notifications.seatChange,
      params: { seat: 0, user: "someone", didTakeSeat: false },
      read: false,
    },
    "Seat change",
    "someone has left seat 0.",
  ],
] as [GameNotification, string, string][])(
  "renders notification type %#",
  (notification, title, body) => {
    expect(renderNotificationTitle(notification)).toBe(title);
    expect(renderNotification(notification)).toBe(body);
  },
);

test("every notification type renders", () => {
  // Guards against a new notification type being added to the union without a
  // matching branch, which would otherwise render as undefined in a push.
  for (const type of Object.values(Notifications)) {
    const notification = {
      gameId: GAME_ID,
      type,
      params: {
        result: "B+R",
        round: 1,
        seat: 0,
        user: "x",
        didTakeSeat: true,
      },
      read: false,
    } as GameNotification;
    expect(renderNotificationTitle(notification)).toBeTruthy();
    expect(renderNotification(notification)).toBeTruthy();
  }
});

describe("isPushSubscriptionJSON", () => {
  const valid = {
    endpoint: "https://push.example.com/abc",
    keys: { p256dh: "key", auth: "auth" },
  };

  test("accepts a well-formed subscription", () => {
    expect(isPushSubscriptionJSON(valid)).toBe(true);
    // Browsers include expirationTime, which we neither store nor mind.
    expect(isPushSubscriptionJSON({ ...valid, expirationTime: null })).toBe(
      true,
    );
  });

  test.each([
    ["null", null],
    ["a string", "https://push.example.com/abc"],
    ["a missing endpoint", { keys: valid.keys }],
    ["an empty endpoint", { endpoint: "", keys: valid.keys }],
    ["missing keys", { endpoint: valid.endpoint }],
    ["null keys", { endpoint: valid.endpoint, keys: null }],
    ["a missing auth key", { endpoint: valid.endpoint, keys: { p256dh: "k" } }],
    [
      "a non-string p256dh",
      { endpoint: valid.endpoint, keys: { p256dh: 1, auth: "a" } },
    ],
  ])("rejects %s", (_label, value) => {
    expect(isPushSubscriptionJSON(value)).toBe(false);
    expect(() => validatePushSubscription(value)).toThrow();
  });
});
