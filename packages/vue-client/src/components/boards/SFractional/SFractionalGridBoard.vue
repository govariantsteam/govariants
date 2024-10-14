<script setup lang="ts">
import { SFractionalState } from "@ogfcommunity/variants-shared";
import { computed } from "vue";
import { MulticolorStone } from "../board_types";
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
    @click="click"
  />
</template>
