<script setup lang="ts">
import { SFractionalState } from "@ogfcommunity/variants-shared";
import { computed } from "vue";
import { MulticolorStone } from "../board_types";
import MulticolorGraphBoard from "../MulticolorGraphBoard.vue";
import { BoardConfig } from "@ogfcommunity/variants-shared";

const props = defineProps<{
  boardConfig: BoardConfig;
  gamestate: SFractionalState;
}>();

const board = computed(() => {
  const sequence = props.gamestate.board.at(0) ?? [];

  return sequence.map<MulticolorStone>((placementColors) => ({
    colors: placementColors,
    annotation: undefined,
  }));
});

const score_board = computed(() => {
  if (!props.gamestate.scoreBoard) {
    return undefined;
  }

  return (props.gamestate.scoreBoard.at(0) ?? []).map(
    (color): string[] | null => (color !== "" ? [color] : null),
  );
});

const emit = defineEmits<{
  (e: "move", move: string): void;
}>();

function click(index: number) {
  emit("move", index.toString());
}
</script>

<template>
  <MulticolorGraphBoard
    :board="board"
    :board_config="$props.boardConfig"
    :score_board="score_board"
    @click="click"
  />
</template>
