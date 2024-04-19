<script setup lang="ts">
import type { DriftGoConfig } from "@/../../shared/src";

const props = defineProps<{ initialConfig: DriftGoConfig }>();
const config = { ...props.initialConfig } as DriftGoConfig;

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
    <input type="number" min="1" v-model="config.width" />
    <label>Height</label>
    <input type="number" min="1" v-model="config.height" />
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
