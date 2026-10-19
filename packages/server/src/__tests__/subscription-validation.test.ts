import { GameResponse, UserResponse } from "@govariants/shared";
import {
  validateSubscription,
  gameTopic,
  seatTopic,
  userNotificationsTopic,
  handleSubscribe,
  handleUnsubscribe,
} from "../socket_validation";

function makeUser(id: string): UserResponse {
  return { id, login_type: "persistent", username: "testuser" };
}

function makeGame(players: ({ id: string } | null)[]): GameResponse {
  return {
    id: "507f1f77bcf86cd799439011",
    variant: "baduk",
    config: { width: 9, height: 9, komi: 5.5 },
    moves: [],
    players: players.map((p) => (p ? { id: p.id, username: p.id } : undefined)),
  };
}

const GAME_ID = "507f1f77bcf86cd799439011";

describe("validateSubscription", () => {
  const mockGetGame = vi.fn<(id: string) => Promise<GameResponse>>();

  beforeEach(() => {
    mockGetGame.mockReset();
  });

  it("allows non-seat topics without validation", async () => {
    const result = await validateSubscription(
      gameTopic(GAME_ID),
      undefined,
      mockGetGame,
    );
    expect(result).toBeNull();
    expect(mockGetGame).not.toHaveBeenCalled();
  });

  it("rejects a user topic even when it is the subscriber's own", async () => {
    const user = makeUser("someuser");

    const result = await validateSubscription(
      userNotificationsTopic(user.id),
      user,
      mockGetGame,
    );
    expect(result).toBe("user topics are not client-subscribable");
  });

  it("rejects seat topic when no user is authenticated", async () => {
    const result = await validateSubscription(
      seatTopic(GAME_ID, 0),
      undefined,
      mockGetGame,
    );
    expect(result).toBe("no authenticated user");
    expect(mockGetGame).not.toHaveBeenCalled();
  });

  it("rejects seat topic when game does not exist", async () => {
    mockGetGame.mockRejectedValue(new Error("Game not found"));

    const result = await validateSubscription(
      seatTopic(GAME_ID, 0),
      makeUser("someuser"),
      mockGetGame,
    );
    expect(result).toBe("game not found");
  });

  it("rejects seat topic when user does not occupy the seat", async () => {
    mockGetGame.mockResolvedValue(makeGame([{ id: "otheruser" }, null]));

    const result = await validateSubscription(
      seatTopic(GAME_ID, 0),
      makeUser("attacker"),
      mockGetGame,
    );
    expect(result).toContain("does not occupy seat 0");
  });

  it("rejects seat topic when seat is empty", async () => {
    mockGetGame.mockResolvedValue(makeGame([null, null]));

    const result = await validateSubscription(
      seatTopic(GAME_ID, 0),
      makeUser("someuser"),
      mockGetGame,
    );
    expect(result).toContain("does not occupy seat 0");
  });

  it("allows seat topic when user occupies the seat", async () => {
    mockGetGame.mockResolvedValue(makeGame([{ id: "rightuser" }, null]));

    const result = await validateSubscription(
      seatTopic(GAME_ID, 0),
      makeUser("rightuser"),
      mockGetGame,
    );
    expect(result).toBeNull();
  });
});

describe("handleSubscribe", () => {
  const mockGetGame = vi.fn<(id: string) => Promise<GameResponse>>();
  const join = vi.fn<(topic: string) => Promise<void>>();

  beforeEach(() => {
    mockGetGame.mockReset();
    join.mockReset().mockResolvedValue(undefined);
  });

  test.each([null, undefined, 42, "topic", {}])(
    "does nothing when topics is not an array (%j)",
    async (topics) => {
      await handleSubscribe(topics, undefined, mockGetGame, join);
      expect(join).not.toHaveBeenCalled();
      expect(mockGetGame).not.toHaveBeenCalled();
    },
  );

  it("joins every allowed topic", async () => {
    await handleSubscribe(
      [gameTopic(GAME_ID), gameTopic("other")],
      undefined,
      mockGetGame,
      join,
    );
    expect(join).toHaveBeenCalledWith(gameTopic(GAME_ID));
    expect(join).toHaveBeenCalledWith(gameTopic("other"));
  });

  it("skips topics rejected by validateSubscription", async () => {
    await handleSubscribe(
      [userNotificationsTopic("someuser")],
      makeUser("someuser"),
      mockGetGame,
      join,
    );
    expect(join).not.toHaveBeenCalled();
  });
});

describe("handleUnsubscribe", () => {
  const leave = vi.fn<(topic: string) => Promise<void>>();

  beforeEach(() => {
    leave.mockReset().mockResolvedValue(undefined);
  });

  test.each([null, undefined, 42, "topic", {}])(
    "does nothing when topics is not an array (%j)",
    async (topics) => {
      await handleUnsubscribe(topics, leave);
      expect(leave).not.toHaveBeenCalled();
    },
  );

  it("leaves every topic", async () => {
    await handleUnsubscribe([gameTopic(GAME_ID), gameTopic("other")], leave);
    expect(leave).toHaveBeenCalledWith(gameTopic(GAME_ID));
    expect(leave).toHaveBeenCalledWith(gameTopic("other"));
  });
});
