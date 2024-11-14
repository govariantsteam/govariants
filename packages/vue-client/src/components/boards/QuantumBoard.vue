<script lang="ts">
import { Color, type CoordinateLike } from "@ogfcommunity/variants-shared";
</script>

<script setup lang="ts">
import DefaultBoard from "./DefaultBoard.vue";
import {
  type QuantumGoState,
  mapBoard,
  isGridBadukConfig,
  MulticolorStone,
  NewBadukConfig,
  moveToIndex,
} from "@ogfcommunity/variants-shared";
import { computed } from "vue";

const props = defineProps<{
  config: NewBadukConfig;
  gamestate: QuantumGoState;
}>();

const emit = defineEmits<{
  (e: "move", move: string): void;
}>();

function emitMove(move: string) {
  emit("move", move);
}

type QuantumIndices = CoordinateLike[] | number[];

function board_with_quantum_stones(
  board: Color[][],
  quantum_stones: QuantumIndices,
) {
  const boardShape = isGridBadukConfig(props.config)
    ? "2d"
    : "flatten-2d-to-1d";
  const multicolor_stone_board = mapBoard(
    board,
    (color) => {
      switch (color) {
        case Color.BLACK:
          return { colors: ["black"] };
        case Color.WHITE:
          return { colors: ["white"] };
        case Color.EMPTY:
          return { colors: [] };
      }
    },
    boardShape,
  );

  quantum_stones.forEach((pos) => {
    // TODO: figure out better types here or add utilities that abstract this
    // difference in index.
    if (boardShape === "2d") {
      pos = pos as CoordinateLike;
      (multicolor_stone_board as MulticolorStone[][])[pos.y][pos.x].colors.push(
        "green",
      );
    } else {
      (multicolor_stone_board as MulticolorStone[])[pos as number].colors.push(
        "green",
      );
    }
  });
  return { board: multicolor_stone_board };
}

const board_0 = computed(() => {
  return board_with_quantum_stones(
    props.gamestate.boards[0],
    props.gamestate.quantum_stones.map(moveToIndex) as QuantumIndices,
  );
});
const board_1 = computed(() => {
  return board_with_quantum_stones(
    props.gamestate.boards[1],
    props.gamestate.quantum_stones.map(moveToIndex) as QuantumIndices,
  );
});
</script>

<template>
  <div style="width: 50%; height: min-content; display: inline-block">
    <DefaultBoard
      :gamestate="board_0"
      :config="props.config"
      v-on:move="emitMove"
    />
  </div>
  <div style="width: 50%; height: min-content; display: inline-block">
    <DefaultBoard
      :gamestate="board_1"
      :config="props.config"
      v-on:move="emitMove"
    />
  </div>
</template>
