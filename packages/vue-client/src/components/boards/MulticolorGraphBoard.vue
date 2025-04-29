<script setup lang="ts">
import { computed, ref, type Ref } from "vue";
import TaegeukStone from "../TaegeukStone.vue";
import IntersectionAnnotation from "../IntersectionAnnotation.vue";
import {
  BoardConfig,
  createBoard,
  Intersection,
  createGraph,
  MulticolorStone,
} from "@ogfcommunity/variants-shared";
import ScoreMark from "./ScoreMark.vue";
import { Voronoi, Site, Cell } from "voronoijs";

const props = defineProps<{
  board?: (MulticolorStone | null)[];
  background_color?: string;
  board_config: BoardConfig;
  score_board?: (string[] | null)[];
}>();

const intersections = computed(() =>
  createBoard(props.board_config, Intersection),
);
const graph = computed(() => createGraph(intersections.value, null));

// Computing the voronoi diagram sometimes crashes due to number
// precision reasons, as discussed in https://github.com/gorhill/Javascript-Voronoi/issues/15
// As a workaround, we round the coordinates, and catch the error for good measure.
const voronoiDiagram = computed(() => {
  // It's easy to accidentally cause this computation unnecessarily
  // (like exchanging order of the logical expression below),
  // so I'd like to keep this console.log.
  console.log("start computing voronoi diagram");
  const sites: Site[] = intersections.value.map((vector, index) => ({
    id: index,
    x: Math.fround(vector.position.X),
    y: Math.fround(vector.position.Y),
  }));

  try {
    const diagram = new Voronoi().compute(sites, {
      xl: viewBox.value.minX - 0.5,
      xr: viewBox.value.minX + viewBox.value.width + 0.5,
      yt: viewBox.value.minY - 0.5,
      yb: viewBox.value.minY + viewBox.value.height + 0.5,
    });

    return sites.map((site) =>
      diagram.cells.find((cell) => cell.site === site),
    );
  } catch (e) {
    console.error(e);
    return [];
  }
});

function getPolygonPointsString(cell: Cell): string {
  return cell.halfedges
    .map(
      (edge) =>
        `${edge.getStartpoint().x.toFixed(8)},${edge
          .getStartpoint()
          .y.toFixed(8)}`,
    )
    .join(" ");
}
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
  const xPositions = intersections.value.map((i) => i.position.X);
  const yPositions = intersections.value.map((i) => i.position.Y);
  const minX = Math.min(...xPositions);
  const minY = Math.min(...yPositions);
  const width = Math.max(...xPositions) - Math.min(...xPositions);
  const height = Math.max(...yPositions) - Math.min(...yPositions);
  return {
    minX: minX,
    minY: minY,
    width: width,
    height: height,
  };
});
</script>

<template>
  <svg
    class="board"
    xmlns="http://www.w3.org/2000/svg"
    v-bind:viewBox="`${viewBox.minX - 1} ${viewBox.minY - 1} ${
      viewBox.width + 2
    } ${viewBox.height + 2}`"
  >
    <rect
      v-bind:x="viewBox.minX - 0.5"
      v-bind:y="viewBox.minY - 0.5"
      v-bind:width="viewBox.width + 1"
      v-bind:height="viewBox.height + 1"
      :fill="background_color ?? '#dcb35c'"
    />
    <g>
      <template v-for="(_, index) in intersections" :key="index">
        <polygon
          v-if="
            props.board?.at(index)?.background_color && voronoiDiagram[index]
          "
          :points="getPolygonPointsString(voronoiDiagram[index]!)"
          :fill="props.board.at(index)!.background_color"
        />
      </template>
    </g>

    <g v-for="(intersection, index) in intersections" :key="index">
      <line
        v-for="neighbour_index in graph
          .neighbors(index)
          .filter((n) => n < index)"
        :key="neighbour_index"
        class="grid"
        v-bind:x1="intersection.position.X"
        v-bind:x2="intersections[neighbour_index].position.X"
        v-bind:y1="intersection.position.Y"
        v-bind:y2="intersections[neighbour_index].position.Y"
      />
    </g>
    <g v-for="(intersection, index) in intersections" :key="index">
      <TaegeukStone
        :key="`${index}: ${intersection.position.X},${intersection.position.Y}`"
        :cx="intersection.position.X"
        :cy="intersection.position.Y"
        :r="0.48"
        :colors="props.board?.at(index)?.colors ?? []"
        @click="positionClicked(index)"
        @mouseover="positionHovered(index)"
      />
    </g>
    <g>
      <template v-for="(intersection, index) in intersections">
        <IntersectionAnnotation
          v-if="props.board?.at(index)?.annotation"
          :key="index"
          :cx="intersection.position.X"
          :cy="intersection.position.Y"
          :r="0.48"
          :annotation="props.board.at(index)?.annotation!"
        />
      </template>
    </g>
    <g v-if="score_board">
      <template v-for="(intersection, index) in intersections" :key="index">
        <ScoreMark
          v-if="score_board?.at(index)"
          :colors="score_board[index]!"
          :cx="intersection.position.X"
          :cy="intersection.position.Y"
        />
      </template>
    </g>
    <g>
      <template v-for="(intersection, index) in intersections" :key="index">
        <rect
          v-if="!props.board?.at(index)?.disable_move"
          @click="positionClicked(index)"
          @mouseover="positionHovered(index)"
          :x="intersection.position.X - 0.5"
          :y="intersection.position.Y - 0.5"
          width="1"
          height="1"
          :fill="hovered == index ? 'pink' : 'transparent'"
          opacity="0.5"
        />
      </template>
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
