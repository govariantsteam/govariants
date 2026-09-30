<script setup lang="ts">
import { computed, ref, type Ref } from "vue";
import TaegeukStone from "../TaegeukStone.vue";
import IntersectionAnnotation from "../IntersectionAnnotation.vue";
import {
  Coordinate,
  getHoshi,
  MulticolorStone,
} from "@govariants/shared";
import { positionsGetter } from "./board_utils";
import {
  STONE_RADIUS,
  LINE_WIDTH,
  BOARD_COLOR,
  STAR_POINT_RADIUS,
  BOARD_EDGE,
  BOARD_MARGIN,
  COORDINATE_FONT_SIZE,
  COORDINATE_HANZI_SQUISH,
  COORDINATE_STACK_GAP,
} from "./board_constants";
import {
  columnLabel,
  injectCoordinateStyle,
  rowLabelEmWidth,
  rowLabelLines,
  type CoordinateStyle,
} from "./coordinates";
import ScoreMark from "./ScoreMark.vue";

const props = defineProps<{
  board?: (MulticolorStone | null)[][];
  backgroundColor?: string;
  boardDimensions: { width: number; height: number };
  scoreBoard?: (string[] | null)[][];
}>();

const width = computed(() => props.boardDimensions.width);
const height = computed(() => props.boardDimensions.height);
const positions = computed(positionsGetter(width, height));

const coordinateStyle = injectCoordinateStyle();

/** Where the edge labels sit and how far the playing surface has to reach to
 * carry them, or null when they are switched off. Coordinates are printed on
 * the surface, so turning them on grows the board rather than crowding it. */
const coordinates = computed(() => {
  const style = coordinateStyle.value;
  if (style === "off") {
    return null;
  }
  const labelWidth = rowLabelEmWidth(height.value, style) * COORDINATE_FONT_SIZE;
  const labelCenter = {
    x: BOARD_EDGE + labelWidth / 2,
    y: BOARD_EDGE + COORDINATE_FONT_SIZE / 2,
  };
  return {
    style,
    labelCenter,
    surface: {
      x: labelCenter.x + labelWidth / 2 + BOARD_EDGE,
      y: labelCenter.y + COORDINATE_FONT_SIZE / 2 + BOARD_EDGE,
    },
  };
});

const surface = computed(
  () => coordinates.value?.surface ?? { x: BOARD_EDGE, y: BOARD_EDGE },
);

const margin = computed(() => ({
  x: surface.value.x + BOARD_MARGIN,
  y: surface.value.y + BOARD_MARGIN,
}));

/** How much a row label is flattened: hanzi start out a little flat, and a
 * stack of them is squashed further to fit between two lines of the grid. */
function squish(lines: number, style: CoordinateStyle): number {
  const upright = style === "1-1" ? COORDINATE_HANZI_SQUISH : 1;
  return Math.min(
    upright,
    (1 - COORDINATE_STACK_GAP) / (lines * COORDINATE_FONT_SIZE),
  );
}

const columnLabels = computed(() => {
  const config = coordinates.value;
  if (!config) {
    return [];
  }
  const edges = [
    -config.labelCenter.y,
    Number(height.value) - 1 + config.labelCenter.y,
  ];
  return Array.from({ length: Number(width.value) }, (_, x) =>
    edges.map((y) => ({ key: `${x},${y}`, x, y, label: columnLabel(x, config.style) })),
  ).flat();
});

const rowLabels = computed(() => {
  const config = coordinates.value;
  if (!config) {
    return [];
  }
  const edges = [
    -config.labelCenter.x,
    Number(width.value) - 1 + config.labelCenter.x,
  ];
  return Array.from({ length: Number(height.value) }, (_, y) => {
    const lines = rowLabelLines(y, height.value, config.style);
    return edges.map((x) => ({
      key: `${x},${y}`,
      transform: `translate(${x} ${y}) scale(1 ${squish(lines.length, config.style)})`,
      // the first line, raised so the stack ends up centred on the row
      top: -((lines.length - 1) * COORDINATE_FONT_SIZE) / 2,
      lines,
    }));
  }).flat();
});

const hovered: Ref<Coordinate> = ref(new Coordinate(-1, -1));

const emit = defineEmits<{
  (e: "click", pos: Coordinate): void;
  (e: "hover", pos: Coordinate): void;
}>();

function positionClicked(pos: Coordinate) {
  emit("click", pos);
}

function positionHovered(pos: Coordinate) {
  emit("hover", pos);
  hovered.value = pos;
}
</script>

<template>
  <svg
    class="board"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="`${-margin.x} ${-margin.y} ${width - 1 + 2 * margin.x} ${
      height - 1 + 2 * margin.y
    }`"
  >
    <rect
      :x="-surface.x"
      :y="-surface.y"
      :width="width - 1 + 2 * surface.x"
      :height="height - 1 + 2 * surface.y"
      :fill="backgroundColor ?? BOARD_COLOR"
    />
    <g v-if="props.board">
      <rect
        v-for="pos in positions.filter((pos) =>
          props.board![pos.y][pos.x]?.background_color,
        )"
        :key="`${pos.x},${pos.y}`"
        :x="pos.x - 0.5"
        :y="pos.y - 0.5"
        width="1"
        height="1"
        :fill="props.board![pos.y][pos.x]!.background_color"
      />
    </g>
    <g>
      <line
        v-for="x in width"
        :key="x"
        :x1="x - 1"
        :x2="x - 1"
        :y1="0"
        :y2="height - 1"
      />

      <line
        v-for="y in height"
        :key="y"
        :x1="0"
        :x2="width - 1"
        :y1="y - 1"
        :y2="y - 1"
      />

      <circle
        v-for="{ x, y } in getHoshi(props.boardDimensions)"
        :key="`${x},${y}`"
        :cx="x"
        :cy="y"
        :r="STAR_POINT_RADIUS"
      />
    </g>
    <g v-if="coordinates" class="coordinates" :font-size="COORDINATE_FONT_SIZE">
      <text v-for="{ key, x, y, label } in columnLabels" :key="key" :x="x" :y="y">
        {{ label }}
      </text>
      <text
        v-for="{ key, transform, top, lines } in rowLabels"
        :key="key"
        :transform="transform"
        x="0"
        :y="top"
      >
        <tspan
          v-for="(line, index) in lines"
          :key="index"
          x="0"
          :dy="index === 0 ? 0 : COORDINATE_FONT_SIZE"
          >{{ line }}</tspan
        >
      </text>
    </g>
    <g v-if="props.board">
      <TaegeukStone
        v-for="pos in positions.filter(
          (pos) => props.board![pos.y][pos.x] !== null,
        )"
        :key="`${pos.x},${pos.y}`"
        :cx="pos.x"
        :cy="pos.y"
        :r="STONE_RADIUS"
        :colors="props.board[pos.y][pos.x]?.colors ?? []"
      />
    </g>
    <g v-if="props.board">
      <IntersectionAnnotation
        v-for="{ x, y } in positions.filter(
          ({ x, y }) => props.board![y][x]?.annotation,
        )"
        :key="`${x},${y}`"
        :cx="x"
        :cy="y"
        :r="STONE_RADIUS"
        :annotation="props.board[y][x]?.annotation!"
      />
    </g>
    <g v-if="scoreBoard">
      <ScoreMark
        v-for="(pos, index) in positions.filter((pos) => scoreBoard![pos.y][pos.x] !== null)"
        :key="index"
        :colors="scoreBoard![pos.y][pos.x]!"
        :cx="pos.x"
        :cy="pos.y"
      />
    </g>
    <g>
      <rect
        v-for="pos in positions.filter(
          (pos) => !props.board?.at(pos.y)?.at(pos.x)?.disable_move,
        )"
        :key="`${pos.x},${pos.y}`"
        :x="pos.x - 0.5"
        :y="pos.y - 0.5"
        width="1"
        height="1"
        :fill="
          hovered.x === pos.x && hovered.y === pos.y ? 'pink' : 'transparent'
        "
        opacity="0.5"
        @click="positionClicked(pos)"
        @mouseover="positionHovered(pos)"
      />
    </g>
    <g />
  </svg>
</template>

<style scoped>
line {
  stroke: black;
  stroke-width: v-bind(LINE_WIDTH);
  stroke-linecap: round;
}

.coordinates {
  fill: black;
  text-anchor: middle;
  dominant-baseline: central;
  user-select: none;
}
</style>
