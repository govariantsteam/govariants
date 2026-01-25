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
  <form class="config-form-column" @change="emitConfigChange">
    <label>Width</label>
    <input v-model="config.width" type="number" min="1" />
    <label>Height</label>
    <input v-model="config.height" type="number" min="1" />
    <label>Number of players</label>
    <input v-model="config.num_players" type="number" min="1" />
    <label>Collision Handling</label>
    <select v-model="config.collision_handling">
      <option :value="'merge'">Merge</option>
      <option :value="'pass'">Pass</option>
      <option :value="'ko'">Ko</option>
    </select>
  </form>
</template>
