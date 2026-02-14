<script setup lang="ts">
import { GridBoardConfig } from "@ogfcommunity/variants-shared";
import { ref } from "vue";

const defaultConfig: GridBoardConfig = {
  type: "grid",
  width: 19,
  height: 19,
};

const props = defineProps<{ initialConfig?: GridBoardConfig }>();

const config = ref(props.initialConfig ?? defaultConfig);

const emit = defineEmits<{
  (e: "configChanged", config: GridBoardConfig): void;
}>();

function emitConfigChange() {
  emit("configChanged", config.value);
}

if (!props.initialConfig) {
  emitConfigChange();
}
</script>

<template>
  <form class="config-form-column" @change="emitConfigChange">
    <div class="" />
    <label>Width</label>
    <input v-model="config.width" type="number" min="1" />
    <label>Height</label>
    <input v-model="config.height" type="number" min="1" />
  </form>
</template>
