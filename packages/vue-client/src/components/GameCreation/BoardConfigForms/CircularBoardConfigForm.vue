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
  <form class="config-form-column" @change="emitConfigChange">
    <label>Nodes per Ring</label>
    <input v-model="config.nodesPerRing" type="number" min="3" />
    <label>Number of Rings</label>
    <input v-model="config.rings" type="number" min="3" />
  </form>
</template>
