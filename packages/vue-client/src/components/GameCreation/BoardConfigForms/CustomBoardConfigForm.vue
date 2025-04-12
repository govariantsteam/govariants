<script setup lang="ts">
import { CustomBoardConfig } from "@ogfcommunity/variants-shared";
import { ref } from "vue";

const defaultConfig: CustomBoardConfig = {
  type: "custom",
  coordinates: [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ],
  adjacencyList: [
    [1, 2],
    [0, 3],
    [0, 3],
    [1, 2],
  ],
};

const props = defineProps<{ initialConfig?: CustomBoardConfig }>();

const configStr = ref<string>(
  JSON.stringify(props.initialConfig ?? defaultConfig),
);

const emit = defineEmits<{
  (e: "configChanged", config: CustomBoardConfig): void;
}>();

function emitConfigChange() {
  let config: unknown;
  try {
    config = JSON.parse(configStr.value);
  } catch {
    return;
  }

  // TODO: more checking?

  emit("configChanged", config as CustomBoardConfig);
}

if (!props.initialConfig) {
  emitConfigChange();
}
</script>

<template>
  <form @change="emitConfigChange" class="config-form-column">
    <textarea v-model="configStr"></textarea>
  </form>
</template>
