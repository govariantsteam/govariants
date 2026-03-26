<script setup lang="ts">
import {
  createBoard,
  type FractionalConfig,
  type FractionalState,
  Intersection,
  getHoshi,
} from "@ogfcommunity/variants-shared";
import { createGraph } from "@ogfcommunity/variants-shared";
import { computed } from "vue";
import TaegeukStone from "../TaegeukStone.vue";
import IntersectionAnnotation from "../IntersectionAnnotation.vue";
import {
  STONE_RADIUS,
  LINE_WIDTH,
  BOARD_COLOR,
  STAR_POINT_RADIUS,
} from "./board_constants";

const props = defineProps<{
  config: FractionalConfig;
  gamestate: FractionalState;
}>();

const emit = defineEmits<{
  (e: "move", Identifier: number): void;
}>();

function intersectionClicked(identifier: number) {
  emit("move", identifier);
}

const intersections = computed(() =>
  createBoard(props.config.board, Intersection),
);

const boardRect = computed(
  (): { x: number; y: number; width: number; height: number } => {
    const xPositions = intersections.value.map((i) => i.position.X);
    const yPositions = intersections.value.map((i) => i.position.Y);
    const xMin = Math.min(...xPositions);
    const xMax = Math.max(...xPositions);
    const yMin = Math.min(...yPositions);
    const yMax = Math.max(...yPositions);
    return {
      x: xMin - 0.5,
      y: yMin - 0.5,
      width: xMax - xMin + 1,
      height: yMax - yMin + 1,
    };
  },
);
const board = computed(() => createGraph(intersections.value, null));

const hoshi = computed(() => {
  const b = props.config.board;
  if (b.type === "grid") {
    return getHoshi(b.width, b.height);
  }
  return [];
});

const viewBox = computed(() => {
  // viewBox is slightly larger than board
  const x = boardRect.value.x - 0.5;
  const y = boardRect.value.y - 0.5;
  const width = boardRect.value.width + 1;
  const height = boardRect.value.height + 1;
  return `${x} ${y} ${width} ${height}`;
});

const stagedMove = computed(() =>
  props.gamestate.stagedMove
    ? {
        intersection:
          intersections.value[props.gamestate.stagedMove.intersectionID],
        colors: props.gamestate.stagedMove.colors,
      }
    : undefined,
);
</script>

<template>
  <svg class="board" xmlns="http://www.w3.org/2000/svg" :viewBox="viewBox">
    <rect
      class="background"
      :x="boardRect.x"
      :y="boardRect.y"
      :width="boardRect.width"
      :height="boardRect.height"
    />
    <g class="lines">
      <g v-for="(intersection, index) in intersections" :key="index">
        <line
          v-for="neighbour_index in board
            .neighbors(index)
            .filter((n) => n < index)"
          :key="neighbour_index"
          class="grid"
          :x1="intersection.position.X"
          :x2="intersections[neighbour_index].position.X"
          :y1="intersection.position.Y"
          :y2="intersections[neighbour_index].position.Y"
        />
      </g>
    </g>
    <g>
      <circle
        v-for="{ x, y } in hoshi"
        :key="`${x},${y}`"
        :cx="x"
        :cy="y"
        :r="STAR_POINT_RADIUS"
      />
    </g>
    <g class="stones">
      <g v-for="(intersection, index) in intersections" :key="index">
        <TaegeukStone
          v-if="$props.gamestate.boardState.at(index)"
          :colors="[...$props.gamestate.boardState.at(index)]"
          :cx="intersection.position.X"
          :cy="intersection.position.Y"
          :r="STONE_RADIUS"
        />
        <IntersectionAnnotation
          v-if="$props.gamestate.lastMoves.includes(index)"
          :cx="intersection.position.X"
          :cy="intersection.position.Y"
          :r="STONE_RADIUS"
          annotation="CR"
        />
        <circle
          v-if="!$props.gamestate.boardState.at(index)"
          class="click-placeholder"
          :cx="intersection.position.X"
          :cy="intersection.position.Y"
          :r="STONE_RADIUS"
          @click="intersectionClicked(index)"
        />
      </g>
    </g>
    <TaegeukStone
      v-if="stagedMove"
      :colors="stagedMove.colors"
      :cx="stagedMove.intersection.position.X"
      :cy="stagedMove.intersection.position.Y"
      :r="STONE_RADIUS"
    />
  </svg>
</template>

<style scoped>
.board .background {
  fill: v-bind(BOARD_COLOR);
}

line {
  stroke: black;
  stroke-width: v-bind(LINE_WIDTH);
  stroke-linecap: round;
}

.click-placeholder {
  opacity: 0;
}
</style>
