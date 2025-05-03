<script setup lang="ts">
import {
  createBoard,
  createGraph,
  Intersection,
  NewBadukConfig,
  generalizedPyramid,
  PyramidConfig,
} from "@ogfcommunity/variants-shared";
import BadukConfigForm from "./BadukConfigForm.vue";

defineProps<{
  initialConfig: NewBadukConfig;
}>();

const emit = defineEmits<{
  (e: "configChanged", config: PyramidConfig): void;
}>();

function emitConfigChange(config: NewBadukConfig) {
  emit("configChanged", {
    ...config,
    ...(config.board.type !== "grid" && {
      weights: generalizedPyramid(
        createGraph(createBoard(config.board, Intersection), null).export()
          .adjacency_array,
      ),
    }),
  });
}
</script>

<template>
  <BadukConfigForm
    @config-changed="emitConfigChange($event)"
    :initial-config="$props.initialConfig"
  />
</template>
