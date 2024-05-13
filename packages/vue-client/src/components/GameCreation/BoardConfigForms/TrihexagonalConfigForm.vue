<script setup lang="ts">
import { TrihexagonalBoardConfig } from "@ogfcommunity/variants-shared";
import { ref } from "vue";

const defaultConfig: TrihexagonalBoardConfig = {
  type: "trihexagonal",
  size: 8,
};

const props = defineProps<{ initialConfig?: TrihexagonalBoardConfig }>();

const config = ref(props.initialConfig ?? defaultConfig);

const emit = defineEmits<{
  (e: "configChanged", config: TrihexagonalBoardConfig): void;
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
