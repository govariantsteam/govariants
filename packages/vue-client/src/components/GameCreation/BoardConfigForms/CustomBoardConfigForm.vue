<script lang="ts">
function validateConfig(config: unknown) {
  if (!(config instanceof Object)) {
    throw new Error("'config' is not an object");
  }

  if (!("coordinates" in config)) {
    throw new Error("no 'coordinates' in config");
  }
  if (!("adjacencyList" in config)) {
    throw new Error("no 'adjacencyList' in config");
  }

  if (!Array.isArray(config.coordinates)) {
    throw new Error("'coordinates' is not an Array");
  }
  if (!Array.isArray(config.adjacencyList)) {
    throw new Error("'adjacencyList' is not an Array");
  }

  if (config.coordinates.length !== config.adjacencyList.length) {
    throw new Error("'coordinates' and 'adjacencyList' must be the same size");
  }

  const numIntersections = config.coordinates.length;

  if (
    !config.coordinates.every(
      (val) =>
        Array.isArray(val) &&
        val.length === 2 &&
        Number.isFinite(val[0]) &&
        Number.isFinite(val[1]),
    )
  ) {
    // tbh we can probably get more specific in the error message
    throw new Error("'coordinates' is invalid");
  }

  if (
    !config.adjacencyList.every(
      (neighbors, idx) =>
        Array.isArray(neighbors) &&
        neighbors.every(
          (neighbor) =>
            Number.isInteger(neighbor) &&
            neighbor !== idx &&
            neighbor >= 0 &&
            neighbor < numIntersections,
        ),
    )
  ) {
    // tbh we can probably get more specific in the error message
    throw new Error("'adjacencyList' is invalid");
  }
}
</script>

<script setup lang="ts">
import { BoardPattern, CustomBoardConfig } from "@ogfcommunity/variants-shared";
import { ref } from "vue";

const defaultConfigStr = `{
  "coordinates": [[0, 0], [0, 1], [1, 0], [1, 1]],
  "adjacencyList": [[1, 2], [0, 3], [0, 3], [1, 2]]
}`;

const props = defineProps<{ initialConfig?: CustomBoardConfig }>();

const error = ref<string>("");

const emit = defineEmits<{
  (e: "configChanged", config: CustomBoardConfig): void;
}>();

const configStr = ref(
  props.initialConfig ? JSON.stringify(props.initialConfig) : defaultConfigStr,
);

function onTextChanged(configStr: string) {
  let config: unknown;
  try {
    config = JSON.parse(configStr);
    validateConfig(config);
  } catch (e) {
    if (e instanceof Error) {
      error.value = e.message;
    }
    return;
  }

  error.value = "";

  (config as CustomBoardConfig).type = BoardPattern.Custom;

  emit("configChanged", config as CustomBoardConfig);
}

if (!props.initialConfig) {
  onTextChanged(configStr.value);
}
</script>

<template>
  <form class="config-form-column">
    <textarea
      v-model="configStr"
      @input="(event) => onTextChanged((event.target as HTMLInputElement).value)"
    ></textarea>
  </form>
  <div class="error">{{ error }}</div>
</template>
