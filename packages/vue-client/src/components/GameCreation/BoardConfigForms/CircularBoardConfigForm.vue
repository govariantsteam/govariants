<script setup lang="ts">
import { CircularBoardConfig } from "@ogfcommunity/variants-shared";
import { ref } from "vue";

const defaultConfig: CircularBoardConfig = {
  type: "circular",
  rings: 9,
  nodesPerRing: 9,
};

const props = defineProps<{ initialConfig?: CircularBoardConfig }>();

const config = ref(props.initialConfig ?? defaultConfig);

const emit = defineEmits<{
  (e: "configChanged", config: CircularBoardConfig): void;
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
    <label>Nodes per Ring</label>
    <input type="number" min="3" v-model="config.nodesPerRing" />
    <label>Number of Rings</label>
    <input type="number" min="3" v-model="config.rings" />
  </form>
</template>
