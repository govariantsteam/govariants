<script setup lang="ts">
import { BoardPattern, FlowerBoardConfig } from "@ogfcommunity/variants-shared";
import { ref } from "vue";

const defaultConfig: FlowerBoardConfig = {
  type: BoardPattern.Flower,
  size: 3,
};

const props = defineProps<{ initialConfig?: FlowerBoardConfig }>();

const config = ref(props.initialConfig ?? defaultConfig);

const emit = defineEmits<{
  (e: "configChanged", config: FlowerBoardConfig): void;
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
    <input type="number" min="1" v-model="config.size" />
  </form>
</template>
