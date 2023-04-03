<script setup lang="ts">
import type {BadukConfig} from "@ogfcommunity/variants-shared";

const props = defineProps<{initialConfig: BadukConfig}>();
const config = {...props.initialConfig} as BadukConfig;

const emit = defineEmits<{
  (e: "configChanged", config: BadukConfig): void
}>();

function emitConfigChange () {
  emit("configChanged", config);
}
</script>

<template>
  <div class="column">
    <label>Width</label>
    <input type="number" min="1" v-model="config.width" @change="emitConfigChange" style="width: fit-content" />
    <label>Height</label>
    <input type="number" min="1" v-model="config.height" @change="emitConfigChange" style="width: fit-content" />
    <label>Komi</label>
    <input type="number" min="0" step="0.5" v-model="config.komi" @change="emitConfigChange" style="width: fit-content" />
  </div>
</template>
