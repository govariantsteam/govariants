/** Every variant played on a rectangular grid has to label its edges.
 *
 * Coordinates reach a board through provide/inject, which a board that never
 * injects silently declines — indistinguishable from a reader who switched
 * them off. That is how grid Fractional went unlabelled for a release. This
 * mounts each grid variant's real playing table and checks the labels are
 * there, so the next board that draws its own grid fails here instead.
 */

import { describe, expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import {
  getDefaultConfig,
  getVariantList,
  makeGameObject,
  uiTransform,
} from "@govariants/shared";
import { getPlayingTable } from "@/playing_table_map";
import { provideCoordinateStyle, type CoordinateStyle } from "../coordinates";
import i18n from "@/i18n";

/** Variants that draw their own board and so are not ours to label: chess is
 * rendered by chessground, and the cube is not a rectangle. */
const FOREIGN_RENDERERS = ["chess", "cube"];

/** Whether a default config puts the variant on a rectangular grid, looking
 * through the wrappers that nest one (rengo's sub-variant, rizoma's pair). */
function hasGridBoard(config: unknown): boolean {
  if (config === null || typeof config !== "object") {
    return false;
  }
  const fields = config as Record<string, unknown>;
  const board = fields.board as { type?: string } | undefined;
  if (board?.type === "grid") {
    return true;
  }
  if (typeof fields.width === "number" && typeof fields.height === "number") {
    return true;
  }
  return Object.values(fields).some(hasGridBoard);
}

const gridVariants = getVariantList().filter(
  (variant) =>
    !FOREIGN_RENDERERS.includes(variant) &&
    hasGridBoard(getDefaultConfig(variant)),
);

function mountTable(variant: string, style: CoordinateStyle) {
  const config = getDefaultConfig(variant);
  const state = makeGameObject(variant, config).exportState({ phase: "play" });
  const transformed = uiTransform(variant, config, state);

  return mount(
    defineComponent({
      setup() {
        provideCoordinateStyle(ref(style));
        const table = getPlayingTable(variant);
        return () =>
          h(table, {
            config: transformed.config,
            gamestate: transformed.gamestate,
            displayedRound: 0,
            nextToPlay: [],
          });
      },
    }),
    { global: { plugins: [i18n] } },
  );
}

describe("grid boards label their edges", () => {
  test("every grid variant is covered", () => {
    // Guards against the filter quietly emptying out.
    expect(gridVariants).toContain("fractional");
    expect(gridVariants).toContain("baduk");
  });

  test.each(gridVariants)("%s shows coordinates when asked", (variant) => {
    const wrapper = mountTable(variant, "a1");
    expect(wrapper.findAll("g.coordinates text").length).toBeGreaterThan(0);
  });

  test.each(gridVariants)("%s hides them when switched off", (variant) => {
    const wrapper = mountTable(variant, "off");
    expect(wrapper.findAll("g.coordinates text")).toHaveLength(0);
  });
});
