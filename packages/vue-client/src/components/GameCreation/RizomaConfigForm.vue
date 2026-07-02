<script setup lang="ts">
import { reactive, watch } from "vue";
import type { RizomaConfig } from "@govariants/shared";

const props = defineProps<{
  initialConfig: RizomaConfig;
}>();

const emit = defineEmits<{
  (e: "configChanged", config: RizomaConfig): void;
}>();

const config = reactive<RizomaConfig>({
  boards: props.initialConfig.boards.map((b) => ({ ...b })),
  global_komi: props.initialConfig.global_komi,
});

function emitChange() {
  emit("configChanged", {
    boards: config.boards.map((b) => ({ ...b })),
    global_komi: config.global_komi,
  });
}

watch(config, emitChange, { deep: true, immediate: true });

function setNumBoards(n: number) {
  const current = config.boards.length;
  if (n > current) {
    for (let i = current; i < n; i++) {
      config.boards.push({ width: 7, height: 7, komi: 0 });
    }
  } else {
    config.boards.splice(n);
  }
}
</script>

<template>
  <div class="rizoma-config-form">
    <div class="field-row">
      <label>Number of boards</label>
      <input
        type="number"
        :value="config.boards.length"
        min="2"
        max="5"
        @change="
          setNumBoards(
            Math.min(
              5,
              Math.max(2, +($event.target as HTMLInputElement).value),
            ),
          )
        "
      />
    </div>

    <div v-for="(board, i) in config.boards" :key="i" class="board-fields">
      <div class="board-title">Board {{ i + 1 }}</div>
      <div class="field-row">
        <label>Width</label>
        <input v-model.number="board.width" type="number" min="2" max="19" />
      </div>
      <div class="field-row">
        <label>Height</label>
        <input v-model.number="board.height" type="number" min="2" max="19" />
      </div>
      <div class="field-row">
        <label>Dynamic komi</label>
        <input v-model.number="board.komi" type="number" min="0" step="0.5" />
      </div>
    </div>

    <div class="field-row">
      <label>Global komi (White)</label>
      <input
        v-model.number="config.global_komi"
        type="number"
        min="0"
        step="0.5"
      />
    </div>
  </div>
</template>

<style scoped>
.rizoma-config-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.board-fields {
  border: 1px solid #444;
  border-radius: 6px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.board-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-row label {
  width: 140px;
  flex-shrink: 0;
}

.field-row input {
  width: 70px;
}
</style>
