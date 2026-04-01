import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import VariantDemoView from "../VariantDemoView.vue";

// Mock the user store
vi.mock("../../stores/user", () => ({
  useCurrentUser: vi.fn(() => ({ value: null })),
  useStore: vi.fn(() => ({})),
}));

// Mock the playing table map
vi.mock("../../playing_table_map", () => ({
  getPlayingTable: vi.fn(() => null),
}));

function mountDemo(variant = "baduk") {
  return mount(VariantDemoView, {
    props: { variant },
    global: {
      stubs: {
        SeatComponent: true,
        NavButtons: true,
        PlayersToMove: true,
      },
    },
  });
}

function emitConfigChange(wrapper: ReturnType<typeof mountDemo>, config: object) {
  const configForm = wrapper.findComponent({ name: "BadukConfigForm" });
  configForm.vm.$emit("config-changed", config);
}

describe("VariantDemoView - error handling", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("shows error message when config is invalid", async () => {
    const wrapper = mountDemo("baduk");

    // Valid config renders without error
    expect(wrapper.find(".error-message").exists()).toBe(false);

    // Trigger an invalid config — baduk rejects height > 52
    emitConfigChange(wrapper, { width: 19, height: 100, komi: 5.5 });
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".error-message").exists()).toBe(true);
    expect(wrapper.find(".error-message").text()).toBeTruthy();
  });

  it("recovers when config becomes valid again", async () => {
    const wrapper = mountDemo("baduk");

    // Break it
    emitConfigChange(wrapper, { width: 19, height: 100, komi: 5.5 });
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".error-message").exists()).toBe(true);

    // Fix it
    emitConfigChange(wrapper, { width: 19, height: 19, komi: 5.5 });
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".error-message").exists()).toBe(false);
  });
});
