<script setup lang="ts">
import type {
  FractionalConfig,
  FractionalState,
} from "@ogfcommunity/variants-shared";
import { computed } from "vue";
import TaegeukStone from "../TaegeukStone.vue";

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

const viewBox = computed(() => {
  const xPositions = props.gamestate.intersections.map((i) => i.position.X);
  const yPositions = props.gamestate.intersections.map((i) => i.position.Y);
  return `${Math.min(...xPositions) - 1} ${Math.min(...yPositions) - 1} ${
    Math.max(...xPositions) + 2
  } ${Math.max(...yPositions) + 2}`;
});

const stagedMove = computed(() => props.gamestate.stagedMove);
</script>

<template>
  <div>
    <h3 style="color: red">Experimental</h3>
    <svg
      class="board"
      xmlns="http://www.w3.org/2000/svg"
      width="600px"
      height="600px"
      :viewBox="viewBox"
    >
      <g class="stones">
        <g
          v-for="intersection in props.gamestate.intersections"
          :key="intersection.id"
        >
          <line
            v-for="neighbour in intersection.neighbours.filter(
              (n) => n.id < intersection.id
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
        <g
          v-for="intersection in props.gamestate.intersections"
          :key="intersection.id"
        >
          <TaegeukStone
            v-if="intersection.stone"
            :colors="[...intersection.stone.colors]"
            :cx="intersection.position.X"
            :cy="intersection.position.Y"
            :r="0.4"
          />
          <circle
            v-else
            class="click-placeholder"
            v-on:click="intersectionClicked(intersection.id)"
            v-bind:cx="intersection.position.X"
            v-bind:cy="intersection.position.Y"
            r="0.4"
          />
        </g>
      </g>
      <TaegeukStone
        v-if="stagedMove"
        :colors="stagedMove.colors"
        :cx="stagedMove.intersection.position.X"
        :cy="stagedMove.intersection.position.Y"
        :r="0.4"
      />
    </svg>
  </div>
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

.click-placeholder {
  opacity: 0;
}
</style>
