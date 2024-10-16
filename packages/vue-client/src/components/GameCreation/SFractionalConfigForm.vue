<script setup lang="ts">
import { BoardConfig, SFractionalConfig } from "@ogfcommunity/variants-shared";
import BoardConfigForm from "./BoardConfigForms/BoardConfigForm.vue";
import { reactive } from "vue";

const maxNrOfSecondaryColors = 16;

const props = defineProps<{
  initialConfig: SFractionalConfig;
}>();

const config: SFractionalConfig = reactive({
  ...props.initialConfig,
  board: { ...props.initialConfig.board },
  secondary_colors: [...props.initialConfig.secondary_colors],
});

const emit = defineEmits<{
  (e: "configChanged", config: SFractionalConfig): void;
}>();

function emitConfigChange() {
  emit("configChanged", config);
}

function setBoardConfig(boardConfig: BoardConfig): void {
  config.board = boardConfig;
  emitConfigChange();
}

function addSecondaryColor(): void {
  config.secondary_colors.push("#008000");
}

function removeSecondaryColor(): void {
  config.secondary_colors = config.secondary_colors.slice(
    0,
    config.secondary_colors.length - 1,
  );
}
</script>

<template>
  <form @change="emitConfigChange" class="config-form-column">
    <BoardConfigForm @config-changed="setBoardConfig($event)" />
    <label>Komi</label>
    <input type="number" step="0.5" v-model="config.komi" />

    <label>Secondary Colors</label>

    <input
      type="color"
      v-for="(_, index) in config.secondary_colors"
      :key="index"
      v-model="config.secondary_colors[index]"
    />
  </form>
  <!-- Note: I would like to place these buttons above the color inputs rather than below. -->
  <!-- But when I put the buttons inside the form tag, clicking it triggers a page reload. -->
  <button
    v-on:click="addSecondaryColor()"
    :disabled="config.secondary_colors.length >= maxNrOfSecondaryColors"
  >
    +
  </button>
  <button
    v-on:click="removeSecondaryColor()"
    :disabled="config.secondary_colors.length <= 1"
  >
    -
  </button>
</template>

<style scoped>
.config-form-column {
  gap: 5px;
  max-width: 300px;
}
input,
select {
  width: 100%;
}
</style>
