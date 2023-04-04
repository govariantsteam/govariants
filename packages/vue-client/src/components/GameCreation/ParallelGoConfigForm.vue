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
  <div class="column">
    <label>Width</label>
    <input
      type="number"
      min="1"
      v-model="config.width"
      @change="emitConfigChange"
      style="width: fit-content"
    />
    <label>Height</label>
    <input
      type="number"
      min="1"
      v-model="config.height"
      @change="emitConfigChange"
      style="width: fit-content"
    />
    <label>Number of players</label>
    <input
      type="number"
      min="1"
      v-model="config.num_players"
      @change="emitConfigChange"
      style="width: fit-content"
    />
    <label>Collision Handling</label>
    <select
      v-model="config.collision_handling"
      @change="emitConfigChange"
      style="width: fit-content"
    >
      <option :value="'merge'">Merge</option>
      <option :value="'pass'">Pass</option>
      <option :value="'ko'">Ko</option>
    </select>
  </div>
</template>
