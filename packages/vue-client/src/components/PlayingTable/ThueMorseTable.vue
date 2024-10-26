<script setup lang="ts">
import { BadukState, GridBadukConfig } from "@ogfcommunity/variants-shared";
import BadukBoardSelector from "../boards/BadukBoardSelector.vue";
import MoveSequenceDisplay from "../MoveSequenceDisplay.vue";
import { count_binary_ones } from "@ogfcommunity/variants-shared";

defineProps<{
  gamestate: BadukState;
  config: GridBadukConfig;
  displayed_round: number;
}>();

function getThueMorseColor(n: number): string[] {
  return [count_binary_ones(n) % 2 ? "white" : "black"];
}

const emit = defineEmits<{
  (e: "move", move: string): void;
}>();

function move(move: string) {
  emit("move", move);
}
</script>
<template>
  <BadukBoardSelector
    :gamestate="$props.gamestate"
    :config="$props.config"
    v-on:move="move"
  />
  <div class="center_aligner">
    <MoveSequenceDisplay
      :length="4"
      :round="displayed_round"
      :get-colors="getThueMorseColor"
    />
  </div>
</template>

<style scoped>
.center_aligner {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}
</style>
