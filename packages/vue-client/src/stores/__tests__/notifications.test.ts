import { describe, it, expect, beforeEach, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { NOTIFICATIONS_COUNT_EVENT } from "@govariants/shared";
import * as requests from "../../requests";
import { useStore } from "../user";
import { useNotificationsCount } from "../notifications";

vi.mock("../../requests", () => ({
  get: vi.fn(),
  post: vi.fn(),
  socket: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
}));

function logIn() {
  const userStore = useStore();
  userStore.user = { id: "user123", login_type: "persistent" };
  userStore.csrf_token = "csrf-token";
  return userStore;
}

describe("notifications store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("fetches the unread count for a logged-in user", async () => {
    vi.mocked(requests.get).mockResolvedValue({ count: 3 });
    logIn();

    const count = useNotificationsCount();
    await flushPromises();

    expect(requests.get).toHaveBeenCalledWith("/notifications/count");
    expect(count.value).toBe(3);
  });

  it("does not fetch when nobody is logged in", async () => {
    const count = useNotificationsCount();
    await flushPromises();

    expect(requests.get).not.toHaveBeenCalled();
    expect(count.value).toBeNull();
  });

  it("clears the count on logout", async () => {
    vi.mocked(requests.get).mockResolvedValue({ count: 3 });
    const userStore = logIn();

    const count = useNotificationsCount();
    await flushPromises();
    expect(count.value).toBe(3);

    userStore.user = null;
    userStore.csrf_token = null;
    await flushPromises();

    expect(count.value).toBeNull();
  });

  it("applies counts pushed by the server", async () => {
    vi.mocked(requests.get).mockResolvedValue({ count: 3 });
    logIn();

    const count = useNotificationsCount();
    await flushPromises();

    const subscription = vi
      .mocked(requests.socket.on)
      .mock.calls.find(([event]) => event === NOTIFICATIONS_COUNT_EVENT);
    expect(subscription).toBeDefined();

    subscription![1](7);
    expect(count.value).toBe(7);
  });
});
