<script lang="ts">
interface MulticolorStone {
  colors: string[];
  annotation?: "CR" | "MA";
}
</script>

<script setup lang="ts">
import { computed, ref, type Ref } from "vue";
import TaegeukStone from "../TaegeukStone.vue";
import IntersectionAnnotation from "../IntersectionAnnotation.vue";
import {
  BoardConfig,
  createBoard,
  Intersection,
} from "@ogfcommunity/variants-shared";

const props = defineProps<{
  board: (MulticolorStone | null)[];
  background_color?: string;
  board_config: BoardConfig;
}>();

const intersections = createBoard(props.board_config, Intersection);
const hovered: Ref<number> = ref(-1);

const emit = defineEmits<{
  (e: "click", index: number): void;
  (e: "hover", index: number): void;
}>();

function positionClicked(index: number) {
  emit("click", index);
}

function positionHovered(index: number) {
  emit("hover", index);
  hovered.value = index;
}

const viewBox = computed(() => {
  const xPositions = intersections.map((i) => i.position.X);
  const yPositions = intersections.map((i) => i.position.Y);
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
    <rect
      x="-0.5"
      y="-0.5"
      width="100%"
      height="100%"
      :fill="background_color ?? '#dcb35c'"
    />

    <g v-for="intersection in intersections" :key="intersection.id">
      <line
        v-for="neighbour in intersection.neighbours.filter(
          (n) => n.id < intersection.id,
        )"
        :key="neighbour.id"
        class="grid"
        v-bind:x1="intersection.position.X"
        v-bind:x2="neighbour.position.X"
        v-bind:y1="intersection.position.Y"
        v-bind:y2="neighbour.position.Y"
      />
    </g>
    <g v-for="intersection in intersections" :key="intersection.id">
      <TaegeukStone
        :key="`${intersection.position.X},${intersection.position.Y}`"
        :cx="intersection.position.X"
        :cy="intersection.position.Y"
        :r="0.48"
        :colors="props.board?.at(intersection.id)?.colors ?? []"
        @click="positionClicked(intersection.id)"
        @mouseover="positionHovered(intersection.id)"
      />
    </g>
    <g>
      <IntersectionAnnotation
        v-for="intersection in intersections.filter(
          (x) => props.board.at(x.id)?.annotation,
        )"
        :key="intersection.id"
        :cx="intersection.position.X"
        :cy="intersection.position.Y"
        :r="0.48"
        :annotation="props.board.at(intersection.id)?.annotation!"
      />
    </g>
    <g>
      <rect
        v-for="intersection in intersections"
        :key="intersection.id"
        @click="positionClicked(intersection.id)"
        @mouseover="positionHovered(intersection.id)"
        :x="intersection.position.X - 0.5"
        :y="intersection.position.Y - 0.5"
        width="1"
        height="1"
        :fill="hovered == intersection.id ? 'pink' : 'transparent'"
        opacity="0.5"
      />
    </g>
    <g></g>
  </svg>
</template>

<style scoped>
line {
  stroke: black;
  stroke-width: 0.02;
  stroke-linecap: round;
}
</style>
