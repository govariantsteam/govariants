import { Grid } from '../../../../shared/src/lib/grid';
<script setup lang="ts">
import { type GridBadukConfig } from "@ogfcommunity/variants-shared";

const props = defineProps<{
  initialConfig: {
    komi: number;
    board: { type: "grid"; width: number; height: number };
  };
}>();
// the type here is ugly atm, but I will fix this when I add input forms for the new board patterns
const config: GridBadukConfig = {
  komi: props.initialConfig.komi,
  board: {
    type: "grid",
    width: props.initialConfig.board.width,
    height: props.initialConfig.board.height,
  },
};

const emit = defineEmits<{
  (e: "configChanged", config: GridBadukConfig): void;
}>();

function emitConfigChange() {
  emit("configChanged", config);
}
</script>

<template>
  <form @change="emitConfigChange" class="config-form-column">
    <label>Width</label>
    <input type="number" min="1" v-model="config.board.width" />
    <label>Height</label>
    <input type="number" min="1" v-model="config.board.height" />
    <label>Komi</label>
    <input type="number" step="0.5" v-model="config.komi" />
  </form>
</template>

<style>
input {
  width: fit-content;
}
</style>
