<script setup lang="ts">
import { Color } from "@ogfcommunity/variants-shared";
import { PolygonalBoardHelperFunctions } from "@ogfcommunity/variants-shared/src/baduk/board/PolygonalBoardHelper";

const helper = new PolygonalBoardHelperFunctions();
const boardsize = 5;
const intersections = helper.CreatePolygonalBoard(boardsize);

// TODO: change the types for these if config or gamestate gets used
defineProps<{
  config: unknown;
  gamestate: unknown;
}>();

function colorToClassString(color: Color): string {
  return color === Color.EMPTY
    ? "click-placeholder"
    : color === Color.BLACK
    ? "stone black"
    : "stone white";
}
</script>

<template>
  <svg
    class="board"
    xmlns="http://www.w3.org/2000/svg"
    width="600px"
    height="600px"
    v-bind:viewBox="`-1 -1 20 20`"
  >
    <rect
      class="background"
      x="-0.5"
      y="-0.5"
      v-bind:width="19"
      v-bind:height="19"
    />
    <g v-for="intersection in intersections" :key="intersection.Identifier">
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
