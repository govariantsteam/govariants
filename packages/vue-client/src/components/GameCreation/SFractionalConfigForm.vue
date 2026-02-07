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
  <form class="config-form-column" @change="emitConfigChange">
    <BoardConfigForm @config-changed="setBoardConfig($event)" />
    <label>Komi</label>
    <input v-model="config.komi" type="number" step="0.5" />

    <div class="row">
      <label class="grow">Secondary Colors</label>
      <button
        class="no-flex"
        type="button"
        :disabled="config.secondary_colors.length >= maxNrOfSecondaryColors"
        @click="addSecondaryColor()"
      >
        +
      </button>
      <button
        class="no-flex"
        type="button"
        :disabled="config.secondary_colors.length <= 1"
        @click="removeSecondaryColor()"
      >
        -
      </button>
    </div>
    <input
      v-for="(_, index) in config.secondary_colors"
      :key="index"
      v-model="config.secondary_colors[index]"
      type="color"
    />
  </form>
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
.row {
  display: flex;
  flex-direction: row;
}
.grow {
  flex-grow: 1;
}
.no-flex {
  flex-grow: 0;
}
</style>
