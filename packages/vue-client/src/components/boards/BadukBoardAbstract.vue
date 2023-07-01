<script setup lang="ts">
import { Color } from "@ogfcommunity/variants-shared";
import type {
  BadukWithAbstractBoardConfig,
  BadukWithAbstractBoardState,
} from "@ogfcommunity/variants-shared/src/variants/badukWithAbstractBoard";
import { computed } from "vue";

const props = defineProps<{
  config: BadukWithAbstractBoardConfig;
  gamestate: BadukWithAbstractBoardState;
}>();

function colorToClassString(color: Color): string {
  return color === Color.EMPTY
    ? "click-placeholder"
    : color === Color.BLACK
    ? "stone black"
    : "stone white";
}

const emit = defineEmits<{
  (e: "move", Identifier: number): void;
}>();

function intersectionClicked(identifier: number) {
  emit("move", identifier);
}

const viewBox = computed(() => {
  const xPositions = props.gamestate.board.Intersections.map(
    (i) => i.Position.X
  );
  const yPositions = props.gamestate.board.Intersections.map(
    (i) => i.Position.Y
  );
  const minX = Math.min(...xPositions) - 1;
  const minY = Math.min(...yPositions) - 1;
  const width = Math.max(...xPositions) - Math.min(...xPositions) + 2;
  const height = Math.max(...yPositions) - Math.min(...yPositions) + 2;
  const vb = `${minX} ${minY} ${width} ${height}`;
  return vb;
});
</script>

<template>
  <svg
    class="board"
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
    v-bind:viewBox="viewBox"
  >
    <g
      v-for="intersection in props.gamestate.board.Intersections"
      :key="intersection.Identifier"
    >
      <line
        v-for="neighbour in intersection.Neighbours.filter(
          (n) => n.Identifier < intersection.Identifier
        )"
        :key="neighbour.Identifier"
        class="grid"
        v-bind:x1="intersection.Position.X"
        v-bind:x2="neighbour.Position.X"
        v-bind:y1="intersection.Position.Y"
        v-bind:y2="neighbour.Position.Y"
      />
    </g>
    <g
      v-for="intersection in props.gamestate.board.Intersections"
      :key="intersection.Identifier"
    >
      <circle
        v-bind:class="colorToClassString(intersection.StoneState.Color)"
        v-on:click="intersectionClicked(intersection.Identifier)"
        v-bind:cx="intersection.Position.X"
        v-bind:cy="intersection.Position.Y"
        r="0.4"
      />
    </g>
  </svg>
</template>

<style scoped>
svg.board {
  background-color: #dcb35c;
}

line {
  stroke: black;
  stroke-width: 0.05;
  stroke-linecap: round;
}

.stone {
  stroke: black;
  stroke-width: 0.05;
}

.stone.black {
  fill: black;
}

.stone.white {
  fill: white;
}

.click-placeholder {
  opacity: 0;
}
</style>
