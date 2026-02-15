<script setup lang="ts">
import { computed, ref, type Ref } from "vue";
import TaegeukStone from "../TaegeukStone.vue";
import IntersectionAnnotation from "../IntersectionAnnotation.vue";
import {
  Coordinate,
  getHoshi,
  MulticolorStone,
} from "@ogfcommunity/variants-shared";
import { positionsGetter } from "./board_utils";
import ScoreMark from "./ScoreMark.vue";

const props = defineProps<{
  board?: (MulticolorStone | null)[][];
  background_color?: string;
  board_dimensions: { width: number; height: number };
  score_board?: (string[] | null)[][];
}>();

const width = computed(() => props.board_dimensions.width);
const height = computed(() => props.board_dimensions.height);
const positions = computed(positionsGetter(width, height));

const hovered: Ref<Coordinate> = ref(new Coordinate(-1, -1));

const emit = defineEmits<{
  (e: "click", pos: Coordinate): void;
  (e: "hover", pos: Coordinate): void;
}>();

function positionClicked(pos: Coordinate) {
  emit("click", pos);
}

function positionHovered(pos: Coordinate) {
  emit("hover", pos);
  hovered.value = pos;
}
</script>

<template>
  <svg
    class="board"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="`-1 -1 ${width + 1} ${height + 1}`"
  >
    <rect
      x="-0.5"
      y="-0.5"
      :width="width"
      :height="height"
      :fill="background_color ?? '#dcb35c'"
    />
    <g v-if="props.board">
      <rect
        v-for="pos in positions.filter((pos) =>
          props.board![pos.y][pos.x]?.background_color,
        )"
        :key="`${pos.x},${pos.y}`"
        :x="pos.x - 0.5"
        :y="pos.y - 0.5"
        width="1"
        height="1"
        :fill="props.board![pos.y][pos.x]!.background_color"
      />
    </g>
    <g>
      <line
        v-for="x in width"
        :key="x"
        :x1="x - 1"
        :x2="x - 1"
        :y1="0"
        :y2="height - 1"
        color="pink"
        stroke="pink"
        stroke-width="0.02"
      />

      <line
        v-for="y in height"
        :key="y"
        :x1="0"
        :x2="width - 1"
        :y1="y - 1"
        :y2="y - 1"
        stroke="pink"
        stroke-width="0.02"
      />

      <circle
        v-for="{ x, y } in getHoshi(width, height)"
        :key="`${x},${y}`"
        :cx="x"
        :cy="y"
        r="0.12"
      />
    </g>
    <g v-if="props.board">
      <TaegeukStone
        v-for="pos in positions.filter(
          (pos) => props.board![pos.y][pos.x] !== null,
        )"
        :key="`${pos.x},${pos.y}`"
        :cx="pos.x"
        :cy="pos.y"
        :r="0.48"
        :colors="props.board[pos.y][pos.x]?.colors ?? []"
      />
    </g>
    <g v-if="props.board">
      <IntersectionAnnotation
        v-for="{ x, y } in positions.filter(
          ({ x, y }) => props.board![y][x]?.annotation,
        )"
        :key="`${x},${y}`"
        :cx="x"
        :cy="y"
        :r="0.48"
        :annotation="props.board[y][x]?.annotation!"
      />
    </g>
    <g v-if="score_board">
      <ScoreMark
        v-for="(pos, index) in positions.filter((pos) => score_board![pos.y][pos.x] !== null)"
        :key="index"
        :colors="score_board![pos.y][pos.x]!"
        :cx="pos.x"
        :cy="pos.y"
      />
    </g>
    <g>
      <rect
        v-for="pos in positions.filter(
          (pos) => !props.board?.at(pos.y)?.at(pos.x)?.disable_move,
        )"
        :key="`${pos.x},${pos.y}`"
        :x="pos.x - 0.5"
        :y="pos.y - 0.5"
        width="1"
        height="1"
        :fill="
          hovered.x === pos.x && hovered.y === pos.y ? 'pink' : 'transparent'
        "
        opacity="0.5"
        @click="positionClicked(pos)"
        @mouseover="positionHovered(pos)"
      />
    </g>
    <g />
  </svg>
</template>

<style scoped>
line {
  stroke: black;
  stroke-width: 0.02;
  stroke-linecap: round;
}
</style>
