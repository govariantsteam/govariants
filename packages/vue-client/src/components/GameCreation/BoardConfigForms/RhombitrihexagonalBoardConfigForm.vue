<script setup lang="ts">
import { RhombitrihexagonalBoardConfig } from "@ogfcommunity/variants-shared";
import { ref } from "vue";

const defaultConfig: RhombitrihexagonalBoardConfig = {
  type: "polygonal",
  size: 4,
};

const props = defineProps<{ initialConfig?: RhombitrihexagonalBoardConfig }>();

const config = ref(props.initialConfig ?? defaultConfig);

const emit = defineEmits<{
  (e: "configChanged", config: RhombitrihexagonalBoardConfig): void;
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
    <label>Size</label>
    <input type="number" min="1" max="6" v-model="config.size" />
  </form>
</template>
