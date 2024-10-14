<script setup lang="ts">
import { BoardConfig, SFractionalConfig } from "@ogfcommunity/variants-shared";
import BoardConfigForm from "./BoardConfigForms/BoardConfigForm.vue";

const props = defineProps<{
  initialConfig: SFractionalConfig;
}>();

const config: SFractionalConfig = {
  ...props.initialConfig,
  board: { ...props.initialConfig.board },
  secondary_colors: [...props.initialConfig.secondary_colors],
};

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

/* TODO: Figure out how to make this work with vues reactivity
function addSecondaryColor(): void {
  config.secondary_colors.push("#008000");
}

function removeSecondaryColor(): void {
  config.secondary_colors = config.secondary_colors.slice(
    0,
    config.secondary_colors.length - 1,
  );
}
*/
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
  <!-- <button v-on:click="addSecondaryColor()">+</button> -->
  <!-- <button v-on:click="removeSecondaryColor()">-</button> -->
</template>

<style scoped>
input,
select {
  width: 100%;
}
</style>
