<script setup lang="ts">
import {
  BoardConfig,
  createBoard,
  createGraph,
  Intersection,
} from "@ogfcommunity/variants-shared";
import { computed } from "vue";

const props = defineProps<{
  config: BoardConfig;
}>();

const isGrid = computed(() => props.config.type === "grid");

// grid

const width = computed(() =>
  props.config.type === "grid" ? props.config.width : null,
);
const height = computed(() =>
  props.config.type === "grid" ? props.config.height : null,
);

// graph

const intersections = computed(() => createBoard(props.config, Intersection));
const graph = computed(() => createGraph(intersections.value, null));
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
  <!-- grid  -->
  <svg
    v-if="isGrid"
    class="board-preview"
    xmlns="http://www.w3.org/2000/svg"
    v-bind:viewBox="`-1 -1 ${width! + 1} ${height! + 1}`"
    style="background-color: #dcb35c"
  >
    <g>
      <line
        v-for="x in width"
        :key="x"
        v-bind:x1="x - 1"
        v-bind:x2="x - 1"
        v-bind:y1="0"
        v-bind:y2="height! - 1"
        color="pink"
        stroke="pink"
        stroke-width="0.02"
      />

      <line
        v-for="y in height"
        :key="y"
        v-bind:x1="0"
        v-bind:x2="width! - 1"
        v-bind:y1="y - 1"
        v-bind:y2="y - 1"
        stroke="pink"
        stroke-width="0.02"
      />
    </g>
  </svg>

  <!-- graph  -->
  <svg
    v-if="!isGrid"
    class="board-preview"
    xmlns="http://www.w3.org/2000/svg"
    v-bind:viewBox="`${viewBox.minX - 1} ${viewBox.minY - 1} ${
      viewBox.width + 2
    } ${viewBox.height + 2}`"
    style="background-color: #dcb35c"
  >
    <g>
      <template v-for="(intersection, index) in intersections" :key="index">
        <line
          v-for="neighbour_index in graph
            .neighbors(index)
            .filter((n) => n < index)"
          :key="neighbour_index"
          v-bind:x1="intersection.position.X"
          v-bind:x2="intersections[neighbour_index].position.X"
          v-bind:y1="intersection.position.Y"
          v-bind:y2="intersections[neighbour_index].position.Y"
        ></line>
      </template>
    </g>
  </svg>
</template>

<style scoped>
line {
  stroke: black;
  stroke-width: 0.02;
  stroke-linecap: round;
}
.board-preview {
  width: 300px;
  height: 300px;
}
</style>
