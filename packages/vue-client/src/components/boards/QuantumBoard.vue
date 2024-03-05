<script lang="ts">
import { Color, type CoordinateLike } from "@ogfcommunity/variants-shared";
</script>

<script setup lang="ts">
import MulticolorGridBoard from "./MulticolorGridBoard.vue";
import {
  Coordinate,
  type QuantumGoState,
  type BadukConfig,
} from "@ogfcommunity/variants-shared";
import { Grid } from "@ogfcommunity/variants-shared";
import { computed } from "vue";

const props = defineProps<{
  config: BadukConfig;
  gamestate: QuantumGoState;
}>();

const emit = defineEmits<{
  (e: "move", pos: string): void;
}>();

function positionClicked(pos: Coordinate) {
  emit("move", pos.toSgfRepr());
}

function board_with_quantum_stones(
  board: Color[][],
  quantum_stones: Array<CoordinateLike>,
) {
  interface MulticolorStone {
    colors: string[];
  }
  const ret: Grid<MulticolorStone | null> = Grid.from2DArray(board).map(
    (color) => {
      switch (color) {
        case Color.BLACK:
          return { colors: ["black"] };
        case Color.WHITE:
          return { colors: ["white"] };
        case Color.EMPTY:
          return null;
      }
    },
  );
  quantum_stones.forEach((pos) => {
    ret.at(pos)?.colors.push("green");
  });
  return ret.to2DArray();
}

const board_0 = computed(() => {
  return board_with_quantum_stones(
    props.gamestate.boards[0],
    props.gamestate.quantum_stones
      .map((pair) => pair[0])
      .filter((pos): pos is string => pos != null)
      .map((pos) => Coordinate.fromSgfRepr(pos)),
  );
});
const board_1 = computed(() => {
  return board_with_quantum_stones(
    props.gamestate.boards[1],
    props.gamestate.quantum_stones
      .map((pair) => pair[1])
      .filter((pos): pos is string => pos != null)
      .map((pos) => Coordinate.fromSgfRepr(pos)),
  );
});
</script>

<template>
  <div style="width: 50%; height: 50%; display: inline-block">
    <MulticolorGridBoard
      :board="board_0"
      :config="props.config"
      @click="positionClicked"
    />
  </div>
  <div style="width: 50%; height: 50%; display: inline-block">
    <MulticolorGridBoard
      :board="board_1"
      :config="props.config"
      @click="positionClicked"
    />
  </div>
</template>
