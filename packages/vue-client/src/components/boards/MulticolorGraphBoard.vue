<script setup lang="ts">
import { computed, ref, type Ref } from "vue";
import TaegeukStone from "../TaegeukStone.vue";
import IntersectionAnnotation from "../IntersectionAnnotation.vue";
import {
  BoardConfig,
  createBoard,
  Intersection,
  createGraph,
} from "@ogfcommunity/variants-shared";
import { MulticolorStone, UnicolorStone } from "./board_types";

const props = defineProps<{
  board: (MulticolorStone | null)[];
  background_color?: string;
  board_config: BoardConfig;
  score_board?: (UnicolorStone | null)[];
}>();

const intersections = computed(() =>
  createBoard(props.board_config, Intersection),
);
const graph = computed(() => createGraph(intersections.value, null));
const hovered: Ref<number> = ref(-1);

const emit = defineEmits<{
  (e: "click", index: number): void;
  (e: "hover", index: number): void;
}>();

function positionClicked(index: number) {
  emit("click", index);
}

function positionHovered(index: number) {
  emit("hover", index);
  hovered.value = index;
}

const viewBox = computed(() => {
  const xPositions = intersections.value.map((i) => i.position.X);
  const yPositions = intersections.value.map((i) => i.position.Y);
  const minX = Math.min(...xPositions);
  const minY = Math.min(...yPositions);
  const width = Math.max(...xPositions) - Math.min(...xPositions);
  const height = Math.max(...yPositions) - Math.min(...yPositions);
  return {
    minX: minX,
    minY: minY,
    width: width,
    height: height,
  };
});
</script>

<template>
  <svg
    class="board"
    xmlns="http://www.w3.org/2000/svg"
    v-bind:viewBox="`${viewBox.minX - 1} ${viewBox.minY - 1} ${
      viewBox.width + 2
    } ${viewBox.height + 2}`"
  >
    <rect
      v-bind:x="viewBox.minX - 0.5"
      v-bind:y="viewBox.minY - 0.5"
      v-bind:width="viewBox.width + 1"
      v-bind:height="viewBox.height + 1"
      :fill="background_color ?? '#dcb35c'"
    />

    <g v-for="(intersection, index) in intersections" :key="index">
      <line
        v-for="neighbour_index in graph
          .neighbors(index)
          .filter((n) => n < index)"
        :key="neighbour_index"
        class="grid"
        v-bind:x1="intersection.position.X"
        v-bind:x2="intersections[neighbour_index].position.X"
        v-bind:y1="intersection.position.Y"
        v-bind:y2="intersections[neighbour_index].position.Y"
      />
    </g>
    <g v-for="(intersection, index) in intersections" :key="index">
      <TaegeukStone
        :key="`${index}: ${intersection.position.X},${intersection.position.Y}`"
        :cx="intersection.position.X"
        :cy="intersection.position.Y"
        :r="0.48"
        :colors="props.board?.at(index)?.colors ?? []"
        @click="positionClicked(index)"
        @mouseover="positionHovered(index)"
      />
    </g>
    <g>
      <IntersectionAnnotation
        v-for="(intersection, index) in intersections.filter(
          (_, idx) => props.board.at(idx)?.annotation,
        )"
        :key="index"
        :cx="intersection.position.X"
        :cy="intersection.position.Y"
        :r="0.48"
        :annotation="props.board.at(index)?.annotation!"
      />
    </g>
    <g v-if="score_board">
      <template v-for="(intersection, index) in intersections" :key="index">
        <rect
          v-if="score_board?.at(index)"
          v-bind:x="intersection.position.X - 0.2"
          v-bind:y="intersection.position.Y - 0.2"
          v-bind:fill="score_board[index]?.color"
          stroke="gray"
          stroke-width="0.05"
          width="0.4"
          height="0.4"
          opacity="0.6"
        />
      </template>
    </g>
    <g>
      <rect
        v-for="(intersection, index) in intersections"
        :key="index"
        @click="positionClicked(index)"
        @mouseover="positionHovered(index)"
        :x="intersection.position.X - 0.5"
        :y="intersection.position.Y - 0.5"
        width="1"
        height="1"
        :fill="hovered == index ? 'pink' : 'transparent'"
        opacity="0.5"
      />
    </g>
    <g></g>
  </svg>
</template>

<style scoped>
line {
  stroke: black;
  stroke-width: 0.02;
  stroke-linecap: round;
}
</style>
