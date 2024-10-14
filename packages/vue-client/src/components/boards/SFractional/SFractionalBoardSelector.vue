<script setup lang="ts">
import { BoardPattern, GridBoardConfig } from "@ogfcommunity/variants-shared";
import {
  SFractionalConfig,
  SFractionalState,
} from "@ogfcommunity/variants-shared";
import { computed } from "vue";
import SFractionalGraphBoard from "./SFractionalGraphBoard.vue";
import SFractionalGridBoard from "./SFractionalGridBoard.vue";

const props = defineProps<{
  config: SFractionalConfig;
  gamestate: SFractionalState;
}>();

const emit = defineEmits<{
  (e: "move", move: string): void;
}>();

function move(move: string) {
  emit("move", move);
}

const isGridBoard = computed(
  () => props.config.board.type === BoardPattern.Grid,
);
</script>

<template>
  <SFractionalGraphBoard
    v-if="!isGridBoard"
    :gamestate="$props.gamestate"
    :boardConfig="$props.config.board"
    @move="move"
  />
  <SFractionalGridBoard
    v-if="isGridBoard"
    :gamestate="$props.gamestate"
    :boardConfig="$props.config.board as GridBoardConfig"
    @move="move"
  />
</template>
