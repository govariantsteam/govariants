import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, fireEvent } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { BoardPattern } from "@ogfcommunity/variants-shared";
import GameCreationForm from "../GameCreationForm.vue";
import * as requests from "@/requests";

vi.mock("@/requests", () => ({
  post: vi.fn(() => Promise.resolve({ id: "game1" })),
  get: vi.fn(),
}));

vi.mock("@/router", () => ({
  default: { push: vi.fn() },
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
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
    const { getByLabelText, getByRole } = render(GameCreationForm, {
      global: { stubs: { TimeControlConfigForm: true, DefaultBoard: true } },
    });
    await flushPromises();

    // Start on baduk (the default), pick a circular board...
    await fireEvent.update(getByLabelText("Pattern"), BoardPattern.Circular);
    await flushPromises();

    // ...then switch to tetris, which reuses the same config form.
    await fireEvent.update(getByLabelText("Variant"), "tetris");
    await flushPromises();

    // The board the form is showing after the variant switch.
    const shownBoard = (getByLabelText("Pattern") as HTMLSelectElement).value;

    await fireEvent.click(getByRole("button", { name: "Create Game" }));
    await flushPromises();

    const body = vi.mocked(requests.post).mock.calls[0][1] as {
      config: { board: { type: string } };
    };

    // The game is created with the board the form is showing, not a stale one.
    expect(body.config.board.type).toBe(shownBoard);
  });
});
