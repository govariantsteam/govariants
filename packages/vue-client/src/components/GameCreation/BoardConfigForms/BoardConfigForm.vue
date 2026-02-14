<script setup lang="ts">
import { BoardConfig, BoardPattern } from "@ogfcommunity/variants-shared";
import { type Ref, ref } from "vue";
import GridBoardConfigForm from "./GridBoardConfigForm.vue";
import GridWithHolesBoardConfigForm from "./GridWithHolesBoardConfigForm.vue";
import RhombitrihexagonalBoardConfigForm from "./RhombitrihexagonalBoardConfigForm.vue";
import CircularBoardConfigForm from "./CircularBoardConfigForm.vue";
import CustomBoardConfigForm from "./CustomBoardConfigForm.vue";
import TrihexagonalConfigForm from "./TrihexagonalConfigForm.vue";
import SierpinskyBoardConfigForm from "./SierpinskyBoardConfigForm.vue";
import SunflowerBoardConfigForm from "./SunflowerBoardConfigForm.vue";
import ExpandablePocket from "@/utils/ExpandablePocket.vue";
import DefaultBoard from "@/components/boards/DefaultBoard.vue";

const _props = defineProps<{ gridOnly?: boolean }>();

const board_type: Ref<string> = ref(BoardPattern.Grid);
const boardConfig: Ref<BoardConfig | undefined> = ref();

// TODO: respect initial board config as defined by variant
// TODO: Add BoardPattern -> (Label, Component) mapping to enable use of v-for

const emit = defineEmits<{
  (e: "configChanged", config: BoardConfig): void;
}>();

function emitConfigChange(config: BoardConfig) {
  boardConfig.value = config;
  emit("configChanged", config);
}
</script>

<template>
  <div class="config-form-column">
    <template v-if="$props.gridOnly !== true">
      <label>Pattern</label>
      <select v-model="board_type">
        <option :value="BoardPattern.Grid">Rectangular</option>
        <option :value="BoardPattern.GridWithHoles">
          Rectangular with holes
        </option>
        <option :value="BoardPattern.Polygonal">Polygonal</option>
        <option :value="BoardPattern.Circular">Circular</option>
        <option :value="BoardPattern.Trihexagonal">Trihexagonal</option>
        <option :value="BoardPattern.Sierpinsky">Sierpinsky Triangle</option>
        <option :value="BoardPattern.Sunflower">Sunflower</option>
        <option :value="BoardPattern.Custom">Custom</option>
      </select>
    </template>
    <GridBoardConfigForm
      v-if="board_type === BoardPattern.Grid"
      @config-changed="emitConfigChange"
    />
    <GridWithHolesBoardConfigForm
      v-if="board_type === BoardPattern.GridWithHoles"
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
    <SunflowerBoardConfigForm
      v-if="board_type === BoardPattern.Sunflower"
      @config-changed="emitConfigChange"
    />
    <CustomBoardConfigForm
      v-if="board_type === BoardPattern.Custom"
      @config-changed="emitConfigChange"
    />
    <ExpandablePocket label="Board preview">
      <div class="event-blocker">
        <DefaultBoard v-if="boardConfig" :config="{ board: boardConfig }" />
      </div>
    </ExpandablePocket>
  </div>
</template>

<style scoped>
.event-blocker {
  pointer-events: none;
}
</style>
