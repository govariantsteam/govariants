<script setup lang="ts">
import { BoardConfig, NewBadukConfig } from "@ogfcommunity/variants-shared";
import BoardConfigForm from "./BoardConfigForms/BoardConfigForm.vue";

const props = defineProps<{
  initialConfig: NewBadukConfig;
  gridOnly?: boolean;
}>();
const config: NewBadukConfig = {
  komi: props.initialConfig.komi,
  board: { ...props.initialConfig.board },
};

const emit = defineEmits<{
  (e: "configChanged", config: NewBadukConfig): void;
}>();

function emitConfigChange() {
  emit("configChanged", config);
}

function setBoardConfig(boardConfig: BoardConfig): void {
  config.board = boardConfig;
  emitConfigChange();
}
</script>

<template>
  <form class="config-form-column" @change="emitConfigChange">
    <BoardConfigForm
      :grid-only="$props.gridOnly"
      @config-changed="setBoardConfig($event)"
    />
    <label>Komi</label>
    <input v-model="config.komi" type="number" step="0.5" />
  </form>
</template>
