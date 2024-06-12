<script setup lang="ts">
import {
  createBoard,
  type FractionalConfig,
  type FractionalState,
} from "@ogfcommunity/variants-shared";
import { computed } from "vue";
import TaegeukStone from "../TaegeukStone.vue";
import { Intersection } from "../../../../shared/src/lib/abstractBoard/intersection";

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
  <svg
    class="board"
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
    :viewBox="viewBox"
  >
    <rect
      class="background"
      :x="boardRect.x"
      :y="boardRect.y"
      :width="boardRect.width"
      :height="boardRect.height"
    />
    <g class="lines">
      <g v-for="intersection in intersections" :key="intersection.id">
        <line
          v-for="neighbour in intersection.neighbours.filter(
            (n) => n.id < intersection.id,
          )"
          :key="neighbour.id"
          class="grid"
          :x1="intersection.position.X"
          :x2="neighbour.position.X"
          :y1="intersection.position.Y"
          :y2="neighbour.position.Y"
        />
      </g>
    </g>
    <g class="stones">
      <g v-for="(intersection, index) in intersections" :key="intersection.id">
        <TaegeukStone
          v-if="$props.gamestate.boardState.at(index)"
          :colors="[...$props.gamestate.boardState.at(index)]"
          :cx="intersection.position.X"
          :cy="intersection.position.Y"
          :r="0.47"
        />
        <circle
          v-else
          class="click-placeholder"
          v-on:click="intersectionClicked(intersection.id)"
          v-bind:cx="intersection.position.X"
          v-bind:cy="intersection.position.Y"
          r="0.47"
        />
      </g>
    </g>
    <TaegeukStone
      v-if="stagedMove"
      :colors="stagedMove.colors"
      :cx="stagedMove.intersection.position.X"
      :cy="stagedMove.intersection.position.Y"
      :r="0.47"
    />
  </svg>
</template>

<style scoped>
.board .background {
  fill: #dcb35c;
}

line {
  stroke: black;
  stroke-width: 0.05;
  stroke-linecap: round;
}

.click-placeholder {
  opacity: 0;
}
</style>
