<script setup lang="ts">
import {
  DefaultBoardConfig,
  DefaultBoardState,
  SFractionalConfig,
  sFractionalMoveColors,
} from "@ogfcommunity/variants-shared";
import MoveSequenceDisplay from "../MoveSequenceDisplay.vue";
import DefaultBoard from "../boards/DefaultBoard.vue";

const props = defineProps<{
  gamestate: DefaultBoardState;
  config: SFractionalConfig & DefaultBoardConfig; // return type of SFractional.uiTransform
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
  <DefaultBoard
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
