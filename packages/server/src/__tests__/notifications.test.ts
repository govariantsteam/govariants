import { NOTIFICATIONS_COUNT_EVENT, Notifications } from "@govariants/shared";
import { setupTestDb, teardownTestDb, clearTestDb } from "./helpers/setup";
import { userNotificationsTopic } from "../socket_validation";

// Mock socket.io so that broadcasts can be inspected without a real server
vi.mock("../socket_io");

import {
  resetMocks as resetSocketIoMocks,
  mockTo,
  mockRoomEmit,
} from "../__mocks__/socket_io";

const ALICE = "alice";
const BOB = "bob";
const GAME_ID = "507f1f77bcf86cd799439011";

// Imported after the test database is set up — see helpers/setup.ts
let notifications: typeof import("../notifications/notifications");

beforeAll(async () => {
  await setupTestDb();
  notifications = await import("../notifications/notifications");
});

afterAll(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  await notifications.initUserNotifications(ALICE);
  await notifications.initUserNotifications(BOB);
  resetSocketIoMocks();
});

/** The counts broadcast since the last reset, keyed by user id. */
function pushedCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  mockTo.mock.calls.forEach(([room], index) => {
    const [event, count] = mockRoomEmit.mock.calls[index];
    expect(event).toBe(NOTIFICATIONS_COUNT_EVENT);
    const userId = [ALICE, BOB].find(
      (id) => userNotificationsTopic(id) === room,
    );
    counts[userId ?? room] = count as number;
  });
  return counts;
}

describe("unread count broadcasts", () => {
  it("pushes the new count to every subscriber of a new round", async () => {
    await notifications.notifyOfNewRound(
      { [ALICE]: [Notifications.myMove], [BOB]: [Notifications.newRound] },
      GAME_ID,
      1,
      [ALICE],
    );

    expect(pushedCounts()).toEqual({ [ALICE]: 1, [BOB]: 1 });
  });

  it("pushes zero to the player who just moved", async () => {
    const subscriptions = {
      [ALICE]: [Notifications.myMove],
      [BOB]: [Notifications.myMove],
    };

    await notifications.notifyOfNewRound(subscriptions, GAME_ID, 1, [ALICE]);
    expect(pushedCounts()).toEqual({ [ALICE]: 1, [BOB]: 0 });

    // Alice plays, so it is Bob's move and Alice's notification is gone
    resetSocketIoMocks();
    await notifications.notifyOfNewRound(subscriptions, GAME_ID, 2, [BOB]);

    expect(pushedCounts()).toEqual({ [ALICE]: 0, [BOB]: 1 });
  });

  it("pushes only to the recipients of a seat change", async () => {
    await notifications.notifyOfSeatChange(
      { [ALICE]: [Notifications.seatChange], [BOB]: [Notifications.myMove] },
      GAME_ID,
      0,
      "charlie",
      true,
    );

    expect(pushedCounts()).toEqual({ [ALICE]: 1 });
  });

  it("pushes zero once the notifications are marked as read", async () => {
    await notifications.notifyOfNewRound(
      { [ALICE]: [Notifications.myMove] },
      GAME_ID,
      1,
      [ALICE],
    );

    resetSocketIoMocks();
    await notifications.markAsRead(ALICE, GAME_ID);

    expect(pushedCounts()).toEqual({ [ALICE]: 0 });
  });

  it("pushes zero once the notifications are cleared", async () => {
    await notifications.notifyOfNewRound(
      { [ALICE]: [Notifications.myMove] },
      GAME_ID,
      1,
      [ALICE],
    );

    resetSocketIoMocks();
    await notifications.clearNotifications(ALICE, GAME_ID);

    expect(pushedCounts()).toEqual({ [ALICE]: 0 });
  });
});
