<script setup lang="ts">
import type { BadukConfig } from "@/../../shared/src";

const props = defineProps<{ initialConfig: BadukConfig }>();
const config = { ...props.initialConfig } as BadukConfig;

const emit = defineEmits<{
  (e: "configChanged", config: BadukConfig): void;
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
  </form>
</template>

<style>
input {
  width: fit-content;
}
</style>
