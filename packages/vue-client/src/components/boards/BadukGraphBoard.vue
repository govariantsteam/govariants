<script setup lang="ts">
import {
  BadukState,
  Color,
  NewBadukConfig,
} from "@ogfcommunity/variants-shared";
import { computed } from "vue";
import MulticolorGraphBoard from "./MulticolorGraphBoard.vue";

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
    @click="click"
  />
</template>
