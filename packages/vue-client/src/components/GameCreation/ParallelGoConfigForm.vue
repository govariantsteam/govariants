<script setup lang="ts">
import type { ParallelGoConfig } from "@ogfcommunity/variants-shared";

const props = defineProps<{ initialConfig: ParallelGoConfig }>();
const config = { ...props.initialConfig } as ParallelGoConfig;

const emit = defineEmits<{
  (e: "configChanged", config: ParallelGoConfig): void;
}>();

function emitConfigChange() {
  emit("configChanged", config);
}
</script>

<template>
  <form @change="emitConfigChange" class="config-form-column">
    <label>Width</label>
    <input type="number" min="1" v-model="config.width" />
    <label>Height</label>
    <input type="number" min="1" v-model="config.height" />
    <label>Number of players</label>
    <input type="number" min="1" v-model="config.num_players" />
    <label>Collision Handling</label>
    <select v-model="config.collision_handling" style="width: fit-content">
      <option :value="'merge'">Merge</option>
      <option :value="'pass'">Pass</option>
      <option :value="'ko'">Ko</option>
    </select>
  </form>
</template>

<style scoped>
input {
  width: fit-content;
}
</style>
