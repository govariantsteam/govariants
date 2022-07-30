<script setup lang="ts">
  import { useStore } from "@/stores/baduk";
  import { Color, type GameResponse } from "@ogfcommunity/variants-shared";
  import { storeToRefs } from "pinia";
  import type { PropType } from "vue";

  const props = defineProps({
    gameResponse: {
      type: Object as PropType<GameResponse>,
      required: true,
    },
  });

  const store = useStore(props.gameResponse.id)();
  const { width, height, board } = storeToRefs(store);

  await store.update(props.gameResponse);

  const positions = new Array(height.value * width.value)
    .fill(null)
    .map((_, index) => [index % width.value, Math.floor(index / width.value)]);

  function colorToClassString(color: Color): string {
    return color === Color.EMPTY
      ? "click-placeholder"
      : color === Color.BLACK
      ? "stone black"
      : "stone white";
  }

  function positionClicked(x: number, y: number) {
    if (board.value[y][x] === Color.EMPTY) {
      store.playMove(x, y);
    }
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
        class="grid"
        v-bind:x1="x - 1"
        v-bind:x2="x - 1"
        v-bind:y1="0"
        v-bind:y2="height - 1"
      />

      <line
        v-for="y in height"
        class="grid"
        v-bind:x1="0"
        v-bind:x2="width - 1"
        v-bind:y1="y - 1"
        v-bind:y2="y - 1"
      />
    </g>
    <g>
      <circle
        v-for="[x, y] in positions"
        v-bind:class="colorToClassString(board[y][x])"
        v-on:click="positionClicked(x, y)"
        v-bind:cx="x"
        v-bind:cy="y"
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
