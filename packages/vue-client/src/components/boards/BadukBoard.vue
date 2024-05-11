<script setup lang="ts">
import {
  Color,
  Coordinate,
  type BadukState,
  getHoshi,
  getWidthAndHeight,
  GridBadukConfig,
} from "@ogfcommunity/variants-shared";
import { computed } from "vue";
import { positionsGetter } from "./board_utils";

const props = defineProps<{
  gamestate: BadukState;
  config: GridBadukConfig;
}>();

const width = computed(() => getWidthAndHeight(props.config).width);
const height = computed(() => getWidthAndHeight(props.config).width);
const positions = computed(positionsGetter(width, height));

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
    width="100%"
    height="100%"
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

      <circle
        v-for="{ x, y } in getHoshi(width, height)"
        :key="`${x},${y}`"
        :cx="x"
        :cy="y"
        r="0.12"
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
    <g v-if="gamestate.score_board">
      <template v-for="pos in positions">
        <rect
          v-if="gamestate.score_board[pos.y][pos.x]"
          :key="`${pos.x},${pos.y}`"
          v-bind:x="pos.x - 0.2"
          v-bind:y="pos.y - 0.2"
          v-bind:fill="
            gamestate.score_board[pos.y][pos.x] === Color.BLACK
              ? 'black'
              : 'white'
          "
          stroke="gray"
          stroke-width="0.05"
          width="0.4"
          height="0.4"
          opacity="0.6"
        />
      </template>
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
