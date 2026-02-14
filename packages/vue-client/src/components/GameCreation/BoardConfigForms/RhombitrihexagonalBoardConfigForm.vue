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
  <form class="config-form-column" @change="emitConfigChange">
    <label>Size</label>
    <input v-model="config.size" type="number" min="1" max="6" />
  </form>
</template>
