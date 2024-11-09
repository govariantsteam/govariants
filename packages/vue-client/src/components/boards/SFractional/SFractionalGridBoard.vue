<script setup lang="ts">
import {
  SFractionalState,
  MulticolorStone,
} from "@ogfcommunity/variants-shared";
import { computed } from "vue";
import MulticolorGridBoard from "../MulticolorGridBoard.vue";
import { Coordinate, GridBoardConfig } from "@ogfcommunity/variants-shared";

const props = defineProps<{
  boardConfig: GridBoardConfig;
  gamestate: SFractionalState;
}>();

const board_dimensions = computed(() => props.boardConfig);

const board = computed(() => {
  return props.gamestate.board.map((row) =>
    row.map<MulticolorStone>((placementColors) => ({
      colors: placementColors,
      annotation: undefined,
    })),
  );
});

const score_board = computed(() => {
  if (!props.gamestate.scoreBoard) {
    return undefined;
  }

  return props.gamestate.scoreBoard.map((row) =>
    row.map((color): string[] | null => (color !== "" ? [color] : null)),
  );
});

const emit = defineEmits<{
  (e: "move", move: string): void;
}>();

function click(pos: Coordinate) {
  emit("move", pos.toSgfRepr());
}
</script>

<template>
  <MulticolorGridBoard
    :board_dimensions="board_dimensions"
    :board="board"
    :score_board="score_board"
    @click="click"
  />
</template>
