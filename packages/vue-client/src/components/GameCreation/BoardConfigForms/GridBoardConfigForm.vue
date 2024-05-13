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
  <form @change="emitConfigChange" class="config-form-column">
    <div class=""></div>
    <label>Width</label>
    <input type="number" min="1" v-model="config.width" />
    <label>Height</label>
    <input type="number" min="1" v-model="config.height" />
  </form>
</template>
