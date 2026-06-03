import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { BoardPattern } from "@ogfcommunity/variants-shared";
import GameCreationForm from "../GameCreationForm.vue";
import BoardConfigForm from "../BoardConfigForms/BoardConfigForm.vue";
import * as requests from "@/requests";

vi.mock("@/requests", () => ({
  post: vi.fn(() => Promise.resolve({ id: "game1" })),
  get: vi.fn(),
}));

vi.mock("@/router", () => ({
  default: { push: vi.fn() },
}));

describe("GameCreationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // baduk, tetris, capture, phantom, etc. all use the same BadukConfigForm.
  // Without a :key on the dynamic <component>, switching between them reused
  // the form instance, so the board shown in the form could diverge from the
  // board actually submitted. Switching variant resets the board to the new
  // variant's default, and the game must be created with that same board.
  it("creates the game with the board shown in the form after switching variant", async () => {
    const wrapper = mount(GameCreationForm, {
      global: { stubs: { TimeControlConfigForm: true, DefaultBoard: true } },
    });
    await flushPromises();

    // Start on baduk (the default), pick a circular board...
    await wrapper
      .findComponent(BoardConfigForm)
      .find("select")
      .setValue(BoardPattern.Circular);
    await flushPromises();

    // ...then switch to tetris, which reuses the same config form.
    await wrapper.find("select").setValue("tetris");
    await flushPromises();

    const createButton = wrapper
      .findAll("button")
      .find((b) => b.text() === "Create Game");
    if (!createButton) throw new Error("Create Game button not found");
    await createButton.trigger("click");
    await flushPromises();

    const body = vi.mocked(requests.post).mock.calls[0][1] as {
      config: { board: { type: string } };
    };
    const shownBoard = wrapper
      .findComponent(BoardConfigForm)
      .find("select").element.value;

    // The variant switch reset the board to tetris's default (grid)...
    expect(body.config.board.type).toBe(BoardPattern.Grid);
    // ...and that is exactly what the form is showing (no stale circular board).
    expect(body.config.board.type).toBe(shownBoard);
  });
});
