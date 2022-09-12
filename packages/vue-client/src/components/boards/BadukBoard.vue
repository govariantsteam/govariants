<script setup lang="ts">
import {
  Color,
  Coordinate,
  type BadukConfig,
  type BadukState,
} from "@ogfcommunity/variants-shared";
import { toRefs } from "vue";

const props = defineProps<{
  gamestate: BadukState;
  config: BadukConfig;
}>();

props.config;

const { width, height } = toRefs(props.config);

const positions = new Array(height.value * width.value)
  .fill(null)
  .map(
    (_, index) =>
      new Coordinate(index % width.value, Math.floor(index / width.value))
  );

function colorToClassString(color: Color): string {
  return color === Color.EMPTY
    ? "click-placeholder"
    : color === Color.BLACK
    ? "stone black"
    : "stone white";
}

const emit = defineEmits<{
  (e: "move", pos: string): void;
}>();

function positionClicked(pos: Coordinate) {
  emit("move", pos.toSgfRepr());
}
</script>

<template>
  <svg
    class="board"
    xmlns="http://www.w3.org/2000/svg"
    width="600px"
    height="600px"
    v-bind:viewBox="`-1 -1 ${width + 1} ${height + 1}`"
  >
    <rect
      class="background"
      x="-0.5"
      y="-0.5"
      v-bind:width="width"
      v-bind:height="height"
    />
    <g>
      <line
        v-for="x in width"
        :key="x"
        class="grid"
        v-bind:x1="x - 1"
        v-bind:x2="x - 1"
        v-bind:y1="0"
        v-bind:y2="height - 1"
      />

      <line
        v-for="y in height"
        :key="y"
        class="grid"
        v-bind:x1="0"
        v-bind:x2="width - 1"
        v-bind:y1="y - 1"
        v-bind:y2="y - 1"
      />
    </g>
    <g>
      <circle
        v-for="pos in positions"
        :key="`${pos.x},${pos.y}`"
        v-bind:class="colorToClassString(gamestate.board[pos.y][pos.x])"
        v-on:click="positionClicked(pos)"
        v-bind:cx="pos.x"
        v-bind:cy="pos.y"
        r="0.4"
      />
    </g>
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
