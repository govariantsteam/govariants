<script setup lang="ts">
import {
  BoardPattern,
  SunflowerBoardConfig,
} from "@ogfcommunity/variants-shared";
import { ref } from "vue";

const defaultConfig: SunflowerBoardConfig = {
  type: BoardPattern.Sunflower,
  size: 2,
};

const props = defineProps<{ initialConfig?: SunflowerBoardConfig }>();

const config = ref(props.initialConfig ?? defaultConfig);

const emit = defineEmits<{
  (e: "configChanged", config: SunflowerBoardConfig): void;
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
