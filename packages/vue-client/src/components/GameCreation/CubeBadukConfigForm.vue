<script setup lang="ts">
import { CubeBadukConfig, BoardPattern } from "@ogfcommunity/variants-shared";
import { ref, watch } from "vue";

const props = defineProps<{
  initialConfig: CubeBadukConfig;
}>();

const faceSize = ref(props.initialConfig.board.faceSize || 9);
const komi = ref(props.initialConfig.komi || 6.5);

const emit = defineEmits<{
  (e: "configChanged", config: CubeBadukConfig): void;
}>();

function emitConfigChange() {
  const config: CubeBadukConfig = {
    komi: komi.value,
    board: {
      type: BoardPattern.Cube,
      faceSize: faceSize.value,
    },
  };
  emit("configChanged", config);
}

watch([faceSize, komi], emitConfigChange);
</script>

<template>
  <form class="config-form-column">
    <label>Face Size (grid size on each face)</label>
    <select v-model.number="faceSize">
      <option :value="5">5x5</option>
      <option :value="7">7x7</option>
      <option :value="9">9x9</option>
      <option :value="11">11x11</option>
      <option :value="13">13x13</option>
    </select>

    <label>Komi</label>
    <input type="number" step="0.5" v-model.number="komi" />
  </form>
</template>

<style scoped>
.config-form-column {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: bold;
  margin-top: 0.5rem;
}

select,
input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
</style>
