<script setup lang="ts">
import { BorderWarConfig, BoardPattern } from "@govariants/shared";

const props = defineProps<{
  initialConfig: BorderWarConfig;
}>();

const fixedBoard = {
  type: BoardPattern.Grid,
  width: 19,
  height: 19,
};

const config: BorderWarConfig = {
  ...props.initialConfig,
  board: { ...(props.initialConfig.board ?? fixedBoard) },
};

const emit = defineEmits<{
  (e: "configChanged", config: BorderWarConfig): void;
}>();

function emitConfigChange() {
  emit("configChanged", config);
}
</script>

<template>
  <form class="config-form-column" @change="emitConfigChange">
    <fieldset disabled class="config-fieldset board-readonly">
      <legend>Board</legend>
      <span class="board-hint">19 x 19 grid (fixed)</span>
    </fieldset>
    <label>Komi</label>
    <input v-model.number="config.komi" type="number" step="0.5" />
    <label>Piece limit</label>
    <input v-model.number="config.pieceLimit" type="number" min="1" />
  </form>
</template>

<style scoped>
.config-fieldset {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px 8px;
  margin-bottom: 8px;
}
.board-readonly {
  opacity: 0.7;
}
.board-hint {
  font-size: small;
}
</style>
