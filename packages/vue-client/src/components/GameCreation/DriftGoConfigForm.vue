<script setup lang="ts">
import {
  getWidthAndHeight,
  type DriftGoConfig,
} from "@ogfcommunity/variants-shared";

const props = defineProps<{ initialConfig: DriftGoConfig }>();
const config: DriftGoConfig = {
  komi: props.initialConfig.komi,
  xShift: props.initialConfig.xShift,
  yShift: props.initialConfig.yShift,
  board: {
    type: "grid",
    width: getWidthAndHeight(props.initialConfig).width,
    height: getWidthAndHeight(props.initialConfig).height,
  },
};

const emit = defineEmits<{
  (e: "configChanged", config: DriftGoConfig): void;
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
    <label>X-Shift</label>
    <input type="number" step="1" v-model="config.xShift" />
    <label>Y-Shift</label>
    <input type="number" step="1" v-model="config.yShift" />
  </form>
</template>

<style>
input {
  width: fit-content;
}
</style>
