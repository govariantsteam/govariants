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
  <form @change="emitConfigChange" class="config-form-column">
    <BoardConfigForm
      @config-changed="setBoardConfig($event)"
      v-bind:grid-only="$props.gridOnly"
    />
    <label>Komi</label>
    <input type="number" step="0.5" v-model="config.komi" />
  </form>
</template>
