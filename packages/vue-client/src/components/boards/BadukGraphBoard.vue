<script setup lang="ts">
import {
  BadukState,
  Color,
  NewBadukConfig,
} from "@ogfcommunity/variants-shared";
import { computed } from "vue";
import MulticolorGraphBoard from "./MulticolorGraphBoard.vue";
import { UnicolorStone } from "./board_types";

const props = defineProps<{
  gamestate: BadukState;
  config: NewBadukConfig;
}>();

const board = computed(() => {
  const sequence = props.gamestate.board.at(0) ?? [];

  return sequence.map((color) => {
    switch (color) {
      case Color.BLACK:
        return { colors: ["black"], annotation: undefined };
      case Color.WHITE:
        return { colors: ["white"], annotation: undefined };
      case Color.EMPTY:
        return null;
    }
  });
});

const score_board = computed(() => {
  if (!props.gamestate.score_board) {
    return undefined;
  }

  return (props.gamestate.score_board.at(0) ?? []).map(
    (color): UnicolorStone | null => {
      switch (color) {
        case Color.BLACK:
          return { color: "black", annotation: undefined };
        case Color.WHITE:
          return { color: "white", annotation: undefined };
        case Color.EMPTY:
          return null;
      }
    },
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
    :board_config="$props.config.board"
    :score_board="score_board"
    @click="click"
  />
</template>
