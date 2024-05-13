<script setup lang="ts">
import { BoardConfig, BoardPattern } from "@ogfcommunity/variants-shared";
import { type Ref, ref } from "vue";
import GridBoardConfigForm from "./GridBoardConfigForm.vue";
import RhombitrihexagonalBoardConfigForm from "./RhombitrihexagonalBoardConfigForm.vue";
import CircularBoardConfigForm from "./CircularBoardConfigForm.vue";
import TrihexagonalConfigForm from "./TrihexagonalConfigForm.vue";
import SierpinskyBoardConfigForm from "./SierpinskyBoardConfigForm.vue";

const props = defineProps<{ gridOnly?: boolean }>();

const board_type: Ref<string> = ref(BoardPattern.Grid);

// TODO: respect initial board config as defined by variant

const emit = defineEmits<{
  (e: "configChanged", config: BoardConfig): void;
}>();

function emitConfigChange(config: BoardConfig) {
  emit("configChanged", config);
}
</script>

<template>
  <div class="config-form-column">
    <template v-if="$props.gridOnly !== true">
      <label>Pattern</label>
      <select v-model="board_type" style="width: fit-content">
        <option :value="BoardPattern.Grid">Rectangular</option>
        <option :value="BoardPattern.Polygonal">Polygonal</option>
        <option :value="BoardPattern.Circular">Circular</option>
        <option :value="BoardPattern.Trihexagonal">Trihexagonal</option>
        <option :value="BoardPattern.Sierpinsky">Sierpinsky Triangle</option>
      </select>
    </template>
    <GridBoardConfigForm
      v-if="board_type === BoardPattern.Grid"
      @config-changed="emitConfigChange"
    />
    <RhombitrihexagonalBoardConfigForm
      v-if="board_type === BoardPattern.Polygonal"
      @config-changed="emitConfigChange"
    />
    <CircularBoardConfigForm
      v-if="board_type === BoardPattern.Circular"
      @config-changed="emitConfigChange"
    />
    <TrihexagonalConfigForm
      v-if="board_type === BoardPattern.Trihexagonal"
      @config-changed="emitConfigChange"
    />
    <SierpinskyBoardConfigForm
      v-if="board_type === BoardPattern.Sierpinsky"
      @config-changed="emitConfigChange"
    />
  </div>
</template>
