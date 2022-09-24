<script setup lang="ts">
import { Color } from "@ogfcommunity/variants-shared";
import type { BadukWithAbstractBoardConfig, BadukWithAbstractBoardState } from "@ogfcommunity/variants-shared/src/baduk/badukWithAbstractBoard";
import { PolygonalBoardHelperFunctions } from "@ogfcommunity/variants-shared/src/baduk/board/PolygonalBoardHelper";
import { propsToAttrMap } from "@vue/shared";

//const helper = new PolygonalBoardHelperFunctions();
//const boardsize = 5;
//const intersections = props.gamestate.board.Intersections;

// TODO: change the types for these if config or gamestate gets used
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
    <g v-for="intersection in props.gamestate.board.Intersections" :key="intersection.Identifier">
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
    <g v-for="intersection in props.gamestate.board.Intersections" :key="intersection.Identifier">
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
