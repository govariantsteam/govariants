<script setup lang="ts">
import {
  BoardPattern,
  CustomBoardConfig,
  validateCustomBoardConfig,
  getCustomBoardConfigWarning,
} from "@ogfcommunity/variants-shared";
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
  let config: CustomBoardConfig;
  try {
    config = JSON.parse(configStr);
    // because we don't want to force the user to enter "type" in
    // the textarea, we set it here
    config.type = BoardPattern.Custom;

    // Blocking errors, like invalid types
    config = validateCustomBoardConfig(config);
  } catch (e) {
    if (e instanceof Error) {
      error.value = e.message;
    }
    return;
  }

  // Non-blocking warnings, such as directed edges
  error.value = getCustomBoardConfigWarning(config);

  emit("configChanged", config);
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

<style scoped>
.error {
  color: red;
  font-size: 0.8em;
  margin-top: 0.5em;
}
</style>
