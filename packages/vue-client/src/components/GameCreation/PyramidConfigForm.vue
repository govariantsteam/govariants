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
  const graph = createGraph(createBoard(config.board, Intersection), null);
  const weights = generalizedPyramid(graph.export().adjacency_array);
  console.log(weights);

  emit("configChanged", { ...config, weights: weights });
}
</script>

<template>
  <BadukConfigForm
    @config-changed="emitConfigChange($event)"
    :initial-config="$props.initialConfig"
  />
</template>
