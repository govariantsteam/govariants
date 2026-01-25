<script setup lang="ts">
import { type DriftGoConfig } from "@ogfcommunity/variants-shared";

const props = defineProps<{ initialConfig: DriftGoConfig }>();
const config: DriftGoConfig = {
  komi: props.initialConfig.komi,
  xShift: props.initialConfig.xShift,
  yShift: props.initialConfig.yShift,
  board: {
    type: "grid",
    width: props.initialConfig.board.width,
    height: props.initialConfig.board.height,
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
  <form class="config-form-column" @change="emitConfigChange">
    <label>Width</label>
    <input v-model="config.board.width" type="number" min="1" />
    <label>Height</label>
    <input v-model="config.board.height" type="number" min="1" />
    <label>Komi</label>
    <input v-model="config.komi" type="number" step="0.5" />
    <label>X-Shift</label>
    <input v-model="config.xShift" type="number" step="1" />
    <label>Y-Shift</label>
    <input v-model="config.yShift" type="number" step="1" />
  </form>
</template>
