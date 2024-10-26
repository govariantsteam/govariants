<script setup lang="ts">
import {
  SFractionalConfig,
  sFractionalMoveColors,
  SFractionalState,
} from "@ogfcommunity/variants-shared";
import MoveSequenceDisplay from "../MoveSequenceDisplay.vue";
import SFractionalBoardSelector from "../boards/SFractional/SFractionalBoardSelector.vue";

const props = defineProps<{
  gamestate: SFractionalState;
  config: SFractionalConfig;
  displayed_round: number;
}>();

function getMoveColor(n: number): string[] {
  return sFractionalMoveColors(n, props.config);
}

const emit = defineEmits<{
  (e: "move", move: string): void;
}>();

function move(move: string) {
  emit("move", move);
}
</script>
<template>
  <SFractionalBoardSelector
    :gamestate="$props.gamestate"
    :config="$props.config"
    v-on:move="move"
  />
  <div class="center_aligner">
    <MoveSequenceDisplay
      :length="Math.min(8, config.secondary_colors.length * 2)"
      :round="displayed_round"
      :get-colors="getMoveColor"
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
