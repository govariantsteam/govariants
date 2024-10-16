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
    @click="click"
  />
</template>
