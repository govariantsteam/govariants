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

  // Regression test: baduk, tetris, capture, phantom, etc. all use the same
  // BadukConfigForm. Without a :key on the dynamic <component>, switching
  // between them reused the form instance, so the board shape shown in the
  // form (and preview) could diverge from the config actually submitted.
  it("creates the game with the board shape currently shown in the form after switching variant", async () => {
    const wrapper = mount(GameCreationForm, {
      global: {
        stubs: { TimeControlConfigForm: true, DefaultBoard: true },
      },
    });
    await flushPromises();

    // Default variant is a Baduk-family variant (baduk). Choose a custom board.
    const patternSelect = wrapper.findComponent(BoardConfigForm).find("select");
    await patternSelect.setValue(BoardPattern.Custom);
    await flushPromises();

    // Switch to another Baduk-family variant that reuses the same config form.
    const variantSelect = wrapper.find("select");
    await variantSelect.setValue("tetris");
    await flushPromises();

    // Create the game.
    await wrapper.find("button.large-button").trigger("click");
    await flushPromises();

    expect(requests.post).toHaveBeenCalledTimes(1);
    const body = vi.mocked(requests.post).mock.calls[0][1] as {
      config: { board: { type: string } };
    };

    // The board shape the form is currently showing after the variant switch.
    const shownPattern = wrapper
      .findComponent(BoardConfigForm)
      .find("select")
      .element.value;

    expect(body.config.board.type).toBe(shownPattern);
  });
});
