import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import * as requests from "../../requests";
import { disablePush } from "../../utils/push";
import { useStore } from "../user";

vi.mock("../../requests", () => ({
  get: vi.fn(),
  post: vi.fn(),
  socket: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
}));

vi.mock("../../utils/push", () => ({
  disablePush: vi.fn(),
}));

function logIn() {
  const userStore = useStore();
  userStore.user = { id: "user123", login_type: "persistent" };
  userStore.csrf_token = "csrf-token";
  return userStore;
}

describe("user store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.mocked(requests.get).mockResolvedValue({});
    vi.mocked(disablePush).mockResolvedValue("disabled");
  });

  it("unsubscribes this browser from push on logout", async () => {
    const userStore = logIn();

    await userStore.logout();

    expect(disablePush).toHaveBeenCalled();
  });

  it("unsubscribes before the session is destroyed", async () => {
    // The unsubscribe route rejects unauthenticated requests, so an
    // unsubscribe issued after /logout would silently leave the row behind.
    const userStore = logIn();

    await userStore.logout();

    const unsubscribedAt = vi.mocked(disablePush).mock.invocationCallOrder[0];
    const loggedOutAt = vi.mocked(requests.get).mock.invocationCallOrder[0];
    expect(unsubscribedAt).toBeLessThan(loggedOutAt);
  });

  it("logs out even when unsubscribing fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(disablePush).mockRejectedValue(new Error("offline"));
    const userStore = logIn();

    await userStore.logout();

    expect(requests.get).toHaveBeenCalledWith("/logout");
    expect(userStore.user).toBeNull();
    expect(userStore.csrf_token).toBeNull();
  });
});
