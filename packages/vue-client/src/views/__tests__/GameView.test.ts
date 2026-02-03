import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import GameView from "../GameView.vue";
import * as requests from "../../requests";
import type { User } from "@ogfcommunity/variants-shared";

// Mock the requests module
vi.mock("../../requests", () => ({
  get: vi.fn(),
  post: vi.fn(),
  socket: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
}));

// Mock the user store
vi.mock("../../stores/user", () => ({
  useCurrentUser: vi.fn(() => ({
    value: {
      id: "user123",
      username: "testuser",
    },
  })),
}));

// Mock the playing table map
vi.mock("../../playing_table_map", () => ({
  getPlayingTable: vi.fn(() => "DefaultTable"),
}));

// Mock SweetAlert2
vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
  },
}));

describe("GameView - Auto-seating", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("should auto-select seat when user occupies exactly one seat", async () => {
    const currentUser: User = {
      id: "user123",
      username: "testuser",
    };

    const players: User[] = [
      currentUser,
      { id: "user456", username: "opponent" },
    ];

    const mockInitialResponse = {
      variant: "baduk",
      config: { width: 19, height: 19 },
      players,
      creator: currentUser,
      stateResponse: {
        seat: null,
        round: 0,
        state: {
          board: [],
          next_to_play: [0],
        },
        next_to_play: [0],
      },
    };

    // Mock the initial state request
    vi.mocked(requests.get).mockResolvedValue(mockInitialResponse);

    const wrapper = mount(GameView, {
      props: {
        gameId: "game123",
      },
      global: {
        stubs: {
          SeatComponent: true,
          NavButtons: true,
          PlayersToMove: true,
          DownloadSGF: true,
          SubscriptionDialog: true,
        },
      },
    });

    await flushPromises();

    const seatComponents = wrapper.findAllComponents({ name: "SeatComponent" });
    expect(seatComponents[0].props("selected")).toBe(0);
    expect(seatComponents[1].props("selected")).toBe(0);
  });
});
