import {
  setupTestDb,
  teardownTestDb,
  clearTestDb,
  getTestClient,
} from "./helpers/setup";
import { GameNotification, Notifications } from "@govariants/shared";

// web-push talks to real push services over the network, so it is replaced
// wholesale. WebPushError has to come from the mock too, since push.ts uses
// `instanceof` to tell a dead subscription from a transient failure.
const mocks = vi.hoisted(() => {
  class WebPushError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
  }
  return {
    sendNotification: vi.fn(),
    setVapidDetails: vi.fn(),
    WebPushError,
  };
});

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: mocks.setVapidDetails,
    sendNotification: mocks.sendNotification,
  },
  WebPushError: mocks.WebPushError,
}));

const USER_A = "507f1f77bcf86cd799439011";
const USER_B = "507f1f77bcf86cd799439012";

function makeSubscription(endpoint: string) {
  return {
    endpoint,
    keys: { p256dh: `p256dh-${endpoint}`, auth: `auth-${endpoint}` },
  };
}

const MY_MOVE: GameNotification = {
  gameId: "507f1f77bcf86cd799439099",
  type: Notifications.myMove,
  params: { round: 3 },
  read: false,
};

let push: typeof import("../notifications/push");

async function storedSubscriptions() {
  const db = (await getTestClient()).db("govariants");
  return db.collection("push_subscriptions").find({}).toArray();
}

beforeAll(async () => {
  process.env.VAPID_PUBLIC_KEY = "test-public-key";
  process.env.VAPID_PRIVATE_KEY = "test-private-key";
  process.env.VAPID_SUBJECT = "mailto:test@example.com";

  await setupTestDb();
  push = await import("../notifications/push");
});

afterAll(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  mocks.sendNotification.mockReset();
  mocks.sendNotification.mockResolvedValue(undefined);
});

describe("subscription storage", () => {
  test("exposes the public key when configured", () => {
    expect(push.getVapidPublicKey()).toBe("test-public-key");
  });

  test("saves a subscription and reports it", async () => {
    await push.savePushSubscription(USER_A, makeSubscription("endpoint-1"));

    expect(await push.hasPushSubscription(USER_A, "endpoint-1")).toBe(true);
    expect(await push.hasPushSubscription(USER_B, "endpoint-1")).toBe(false);
    expect(await push.hasPushSubscription(USER_A, "endpoint-2")).toBe(false);
  });

  test("saving the same endpoint twice does not duplicate it", async () => {
    await push.savePushSubscription(USER_A, makeSubscription("endpoint-1"));
    await push.savePushSubscription(USER_A, makeSubscription("endpoint-1"));

    expect(await storedSubscriptions()).toHaveLength(1);
  });

  test("re-subscribing as another user reassigns the endpoint", async () => {
    // One browser, one endpoint: signing out and in as someone else must not
    // leave the previous account receiving this browser's notifications.
    await push.savePushSubscription(USER_A, makeSubscription("endpoint-1"));
    await push.savePushSubscription(USER_B, makeSubscription("endpoint-1"));

    expect(await storedSubscriptions()).toHaveLength(1);
    expect(await push.hasPushSubscription(USER_A, "endpoint-1")).toBe(false);
    expect(await push.hasPushSubscription(USER_B, "endpoint-1")).toBe(true);
  });

  test("stores only the fields we asked for", async () => {
    // The shape validator accepts extra properties, so the storage layer is
    // what keeps arbitrary client JSON out of the document.
    await push.savePushSubscription(USER_A, {
      ...makeSubscription("endpoint-1"),
      keys: {
        p256dh: "p256dh-endpoint-1",
        auth: "auth-endpoint-1",
        smuggled: "nope",
      },
      alsoSmuggled: "nope",
    } as unknown as Parameters<typeof push.savePushSubscription>[1]);

    const [stored] = await storedSubscriptions();
    expect(stored.keys).toEqual({
      p256dh: "p256dh-endpoint-1",
      auth: "auth-endpoint-1",
    });
    expect(stored).not.toHaveProperty("alsoSmuggled");
  });

  test("coerces a non-string endpoint instead of querying with it", async () => {
    // A query operator smuggled in as the endpoint must not reach Mongo as an
    // object, or it would match (and overwrite) somebody else's row.
    await push.savePushSubscription(USER_A, {
      endpoint: { $ne: null },
      keys: { p256dh: "p", auth: "a" },
    } as unknown as Parameters<typeof push.savePushSubscription>[1]);

    const [stored] = await storedSubscriptions();
    expect(typeof stored.endpoint).toBe("string");
  });

  test("deleting is scoped to the owning user", async () => {
    await push.savePushSubscription(USER_A, makeSubscription("endpoint-1"));

    await push.deletePushSubscription(USER_B, "endpoint-1");
    expect(await push.hasPushSubscription(USER_A, "endpoint-1")).toBe(true);

    await push.deletePushSubscription(USER_A, "endpoint-1");
    expect(await push.hasPushSubscription(USER_A, "endpoint-1")).toBe(false);
  });

  test("deletes every subscription of a user", async () => {
    await push.savePushSubscription(USER_A, makeSubscription("endpoint-1"));
    await push.savePushSubscription(USER_A, makeSubscription("endpoint-2"));
    await push.savePushSubscription(USER_B, makeSubscription("endpoint-3"));

    await push.deleteAllPushSubscriptionsOfUser(USER_A);

    const remaining = await storedSubscriptions();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].endpoint).toBe("endpoint-3");
  });
});

describe("sendPushNotification", () => {
  test("sends the rendered notification to each of a user's browsers", async () => {
    await push.savePushSubscription(USER_A, makeSubscription("endpoint-1"));
    await push.savePushSubscription(USER_A, makeSubscription("endpoint-2"));

    await push.sendPushNotification([USER_A], MY_MOVE);

    expect(mocks.sendNotification).toHaveBeenCalledTimes(2);
    const [subscription, payload] = mocks.sendNotification.mock.calls[0];
    expect(subscription).toEqual(makeSubscription("endpoint-1"));
    expect(JSON.parse(payload)).toEqual({
      title: "Your move",
      body: "It's your move in round 3.",
      gameId: MY_MOVE.gameId,
    });
  });

  test("only sends to the listed recipients", async () => {
    await push.savePushSubscription(USER_A, makeSubscription("endpoint-1"));
    await push.savePushSubscription(USER_B, makeSubscription("endpoint-2"));

    await push.sendPushNotification([USER_B], MY_MOVE);

    expect(mocks.sendNotification).toHaveBeenCalledTimes(1);
    expect(mocks.sendNotification.mock.calls[0][0].endpoint).toBe("endpoint-2");
  });

  test("does nothing without recipients or subscriptions", async () => {
    await push.sendPushNotification([], MY_MOVE);
    await push.sendPushNotification([USER_A], MY_MOVE);

    expect(mocks.sendNotification).not.toHaveBeenCalled();
  });

  test.each([404, 410])(
    "drops a subscription the push service rejects with %i",
    async (statusCode) => {
      await push.savePushSubscription(USER_A, makeSubscription("endpoint-1"));
      mocks.sendNotification.mockRejectedValue(
        new mocks.WebPushError("gone", statusCode),
      );

      await push.sendPushNotification([USER_A], MY_MOVE);

      expect(await storedSubscriptions()).toHaveLength(0);
    },
  );

  test("keeps a subscription after a transient failure", async () => {
    await push.savePushSubscription(USER_A, makeSubscription("endpoint-1"));
    mocks.sendNotification.mockRejectedValue(
      new mocks.WebPushError("service unavailable", 503),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    await push.sendPushNotification([USER_A], MY_MOVE);

    expect(await storedSubscriptions()).toHaveLength(1);
    vi.mocked(console.error).mockRestore();
  });

  test("a failing push service does not reject", async () => {
    // Sending happens on the move-submission path, so a push failure must
    // never surface as a failed move.
    await push.savePushSubscription(USER_A, makeSubscription("endpoint-1"));
    mocks.sendNotification.mockRejectedValue(new Error("network down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      push.sendPushNotification([USER_A], MY_MOVE),
    ).resolves.toBeUndefined();

    vi.mocked(console.error).mockRestore();
  });
});

test("push is inert when VAPID keys are not configured", async () => {
  // A deployment without keys should quietly skip push rather than throw on
  // every notification. Re-imported so the module re-reads the environment.
  vi.resetModules();
  const saved = process.env.VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PUBLIC_KEY;
  vi.spyOn(console, "warn").mockImplementation(() => {});

  try {
    const unconfigured = await import("../notifications/push");
    expect(unconfigured.getVapidPublicKey()).toBeNull();
    await expect(
      unconfigured.sendPushNotification([USER_A], MY_MOVE),
    ).resolves.toBeUndefined();
    expect(mocks.sendNotification).not.toHaveBeenCalled();
  } finally {
    process.env.VAPID_PUBLIC_KEY = saved;
    vi.mocked(console.warn).mockRestore();
    vi.resetModules();
  }
});
