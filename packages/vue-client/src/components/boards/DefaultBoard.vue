<!--
This board is meant to be easy for a variety of variants to use.
It supports features such as multicolor stones, non-grid boards,
board color etc.
-->

<script setup lang="ts">
import MulticolorGridBoard from "./MulticolorGridBoard.vue";
import { Coordinate, indexToMove } from "@ogfcommunity/variants-shared";
import MulticolorGraphBoard from "./MulticolorGraphBoard.vue";
import {
  DefaultBoardConfig,
  DefaultBoardState,
  MulticolorStone,
} from "@ogfcommunity/variants-shared";

const props = defineProps<{
  config: DefaultBoardConfig;
  gamestate?: DefaultBoardState;
}>();

const emit = defineEmits<{
  (e: "move", pos: string): void;
}>();

function positionClicked(pos: Coordinate | number) {
  emit("move", indexToMove(pos));
}
</script>

<template>
  <MulticolorGridBoard
    v-if="props.config.board.type === 'grid'"
    :board="props.gamestate?.board as ((MulticolorStone | null)[][] | undefined)"
    :board_dimensions="props.config.board"
    :background_color="props.gamestate?.backgroundColor"
    :score_board="props.gamestate?.score_board as ((string[] | null)[][] | undefined)"
    @click="positionClicked"
  />
  <MulticolorGraphBoard
    v-else
    :board="props.gamestate?.board as ((MulticolorStone | null)[] | undefined)"
    :board_config="$props.config.board"
    :background_color="props.gamestate?.backgroundColor"
    :score_board="props.gamestate?.score_board as ((string[] | null)[] | undefined)"
    @click="positionClicked"
  />
</template>
