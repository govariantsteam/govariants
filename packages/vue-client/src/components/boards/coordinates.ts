/** Edge labels for a rectangular board, in the two conventions described at
 * https://senseis.xmp.net/?Coordinates :
 *
 * - `a1`: letters left to right, numbers bottom to top, so A1 is the
 *   lower-left corner. I is skipped, historically to keep it apart from J.
 * - `1-1`: numbers left to right, hanzi numerals top to bottom, so 1-1 is the
 *   upper-left corner.
 */

import { computed, inject, provide, type InjectionKey, type Ref } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { LOCAL_STORAGE_KEYS } from "@/local_storage_keys";

export const COORDINATE_STYLES = ["off", "a1", "1-1"] as const;
export type CoordinateStyle = (typeof COORDINATE_STYLES)[number];

/** The reader's setting, for the settings page to bind to. */
export function useCoordinateStyle(): Ref<CoordinateStyle> {
  return useLocalStorage<CoordinateStyle>(
    LOCAL_STORAGE_KEYS.coordinates,
    "off",
  );
}

const coordinateStyleKey: InjectionKey<Ref<CoordinateStyle>> =
  Symbol("coordinateStyle");

/** Label the boards under this view. Views that show a board as an illustration
 * rather than as the thing being played — a game list, a config preview — leave
 * this alone and get unlabelled boards.
 *
 * Defaults to the reader's setting; pass a style to label boards with something
 * else. */
export function provideCoordinateStyle(
  style: Ref<CoordinateStyle> = useCoordinateStyle(),
): void {
  provide(coordinateStyleKey, style);
}

export function injectCoordinateStyle(): Ref<CoordinateStyle> {
  return inject(
    coordinateStyleKey,
    computed<CoordinateStyle>(() => "off"),
  );
}

const A1_LETTERS = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
const HANZI_DIGITS = "〇一二三四五六七八九";
const HANZI_POWERS = ["", "十", "百", "千"];

/** A, B, ... Z, AA, AB, ... for boards wider than the alphabet. */
function letterLabel(index: number): string {
  let label = "";
  for (let n = index; n >= 0; n = Math.floor(n / A1_LETTERS.length) - 1) {
    label = A1_LETTERS[n % A1_LETTERS.length] + label;
  }
  return label;
}

function hanziNumeral(value: number): string {
  if (value < 1 || value >= 10 ** HANZI_POWERS.length) {
    return String(value);
  }
  let label = "";
  let remaining = value;
  for (let power = HANZI_POWERS.length - 1; power >= 0; power--) {
    const digit = Math.floor(remaining / 10 ** power);
    remaining %= 10 ** power;
    if (digit === 0) {
      continue;
    }
    // 十, 百 and 千 stand alone rather than take a leading 一
    const prefix = digit === 1 && power > 0 ? "" : HANZI_DIGITS[digit];
    label += prefix + HANZI_POWERS[power];
  }
  return label;
}

export function columnLabel(x: number, style: CoordinateStyle): string {
  return style === "a1" ? letterLabel(x) : String(x + 1);
}

export function rowLabel(
  y: number,
  height: number,
  style: CoordinateStyle,
): string {
  return style === "a1" ? String(height - y) : hanziNumeral(y + 1);
}

/** A row label split into the lines it is written on. The 1-1 style stacks its
 * hanzi top to bottom, the way vertical text is written. */
export function rowLabelLines(
  y: number,
  height: number,
  style: CoordinateStyle,
): string[] {
  const label = rowLabel(y, height, style);
  return style === "1-1" ? [...label] : [label];
}

/** Width of the widest row label in em, for reserving room beside the board.
 * A stacked label is one glyph wide however tall it gets. */
export function rowLabelEmWidth(
  height: number,
  style: CoordinateStyle,
): number {
  // hanzi are full-width; digits and capitals run about 0.6em in a sans face
  const em = style === "a1" ? 0.6 : 1;
  let widest = 0;
  for (let y = 0; y < height; y++) {
    const lines = rowLabelLines(y, height, style);
    widest = Math.max(widest, ...lines.map((line) => line.length));
  }
  return widest * em;
}
