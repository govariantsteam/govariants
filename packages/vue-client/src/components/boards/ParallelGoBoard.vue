<script setup lang="ts">
import MulticolorGridBoard from "./MulticolorGridBoard.vue";
import type {
  ParallelGoConfig,
  ParallelGoState,
} from "@ogfcommunity/variants-shared";
import { Grid } from "@ogfcommunity/variants-shared";
import { computed } from "vue";

const props = defineProps<{
  config: ParallelGoConfig;
  gamestate: ParallelGoState;
}>();

function isKoStone(colors: number[]) {
  return colors.length === 1 && colors[0] === -1;
}

// https://sashamaps.net/docs/resources/20-colors/
const distinct_colors =
  props.config.num_players === 2
    ? ["black", "white"]
    : [
        "#e6194B",
        "#3cb44b",
        "#ffe119",
        "#4363d8",
        "#f58231",
        "#911eb4",
        "#42d4f4",
        "#f032e6",
        "#bfef45",
        "#fabed4",
        "#469990",
        "#dcbeff",
        "#9A6324",
        "#fffac8",
        "#800000",
        "#aaffc3",
        "#808000",
        "#ffd8b1",
        "#000075",
        "#a9a9a9",
        "#ffffff",
        "#000000",
      ];

function coordsToLetters(x: number, y: number) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alphabet[x] + alphabet[y];
}

const emit = defineEmits<{
  (e: "move", pos: string): void;
}>();

function positionClicked(x: number, y: number) {
  emit("move", coordsToLetters(x, y));
}

const board = computed(() => {
  const gboard = Grid.from2DArray(props.gamestate.board);
  return gboard
    .map((players) => {
      if (isKoStone(players)) {
        return { colors: ["red"] };
      }
      if (players.length === 0) {
        return null;
      }
      return { colors: players.map((player) => distinct_colors[player]) };
    })
    .to2DArray();
});
</script>

<template>
  <MulticolorGridBoard
    :board="board"
    :config="props.config"
    @click="({ x, y }) => positionClicked(x, y)"
  />
</template>
