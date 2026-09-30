/** Shared visual constants for board components.
 * Keep all board renderings consistent by using these values. */

export const STONE_RADIUS = 0.48;
export const LINE_WIDTH = 0.02;
export const BOARD_COLOR = "#dcb35c";
export const STAR_POINT_RADIUS = 0.12;
/** Clearance between the outermost line and whatever the playing surface
 * carries beyond it: its own edge, or a coordinate printed on it. */
export const BOARD_EDGE = 0.5;
/** Whitespace around the playing surface. */
export const BOARD_MARGIN = 0.5;
export const COORDINATE_FONT_SIZE = 0.6;
/** Whitespace between one stacked coordinate and the next. Stacked glyphs are
 * flattened to make room rather than shrunk, so they stay legible across. */
export const COORDINATE_STACK_GAP = 0.2;
/** Hanzi coordinates are set a little flat even standing alone, the way they
 * are printed on a goban. A stack is flattened further to fit. */
export const COORDINATE_HANZI_SQUISH = 0.85;
