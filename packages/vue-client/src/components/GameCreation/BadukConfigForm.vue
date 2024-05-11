import { Grid } from '../../../../shared/src/lib/grid';
<script setup lang="ts">
import {
  getWidthAndHeight,
  type GridBadukConfig,
} from "@ogfcommunity/variants-shared";

const props = defineProps<{ initialConfig: GridBadukConfig }>();
const config: GridBadukConfig = {
  komi: props.initialConfig.komi,
  board: {
    type: "grid",
    width: getWidthAndHeight(props.initialConfig).width,
    height: getWidthAndHeight(props.initialConfig).height,
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
