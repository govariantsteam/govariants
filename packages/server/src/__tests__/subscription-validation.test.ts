import { GameResponse, UserResponse } from "@ogfcommunity/variants-shared";
import {
  validateSeatSubscription,
  gameTopic,
  seatTopic,
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

describe("validateSeatSubscription", () => {
  const mockGetGame = vi.fn<(id: string) => Promise<GameResponse>>();

  beforeEach(() => {
    mockGetGame.mockReset();
  });

  it("allows non-seat topics without validation", async () => {
    const result = await validateSeatSubscription(
      gameTopic(GAME_ID),
      undefined,
      mockGetGame,
    );
    expect(result).toBeNull();
    expect(mockGetGame).not.toHaveBeenCalled();
  });

  it("rejects seat topic when no user is authenticated", async () => {
    const result = await validateSeatSubscription(
      seatTopic(GAME_ID, 0),
      undefined,
      mockGetGame,
    );
    expect(result).toBe("no authenticated user");
    expect(mockGetGame).not.toHaveBeenCalled();
  });

  it("rejects seat topic when game does not exist", async () => {
    mockGetGame.mockRejectedValue(new Error("Game not found"));

    const result = await validateSeatSubscription(
      seatTopic(GAME_ID, 0),
      makeUser("someuser"),
      mockGetGame,
    );
    expect(result).toBe("game not found");
  });

  it("rejects seat topic when user does not occupy the seat", async () => {
    mockGetGame.mockResolvedValue(makeGame([{ id: "otheruser" }, null]));

    const result = await validateSeatSubscription(
      seatTopic(GAME_ID, 0),
      makeUser("attacker"),
      mockGetGame,
    );
    expect(result).toContain("does not occupy seat 0");
  });

  it("rejects seat topic when seat is empty", async () => {
    mockGetGame.mockResolvedValue(makeGame([null, null]));

    const result = await validateSeatSubscription(
      seatTopic(GAME_ID, 0),
      makeUser("someuser"),
      mockGetGame,
    );
    expect(result).toContain("does not occupy seat 0");
  });

  it("allows seat topic when user occupies the seat", async () => {
    mockGetGame.mockResolvedValue(makeGame([{ id: "rightuser" }, null]));

    const result = await validateSeatSubscription(
      seatTopic(GAME_ID, 0),
      makeUser("rightuser"),
      mockGetGame,
    );
    expect(result).toBeNull();
  });
});
