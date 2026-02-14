<script setup lang="ts">
import { computed } from "vue";

const width = 0.4;
const height = 0.4;
const stroke_width = 0.05;

const props = defineProps<{
  colors: string[];
  cx: number;
  cy: number;
}>();

const segmentHeight = computed(() => +(height / props.colors.length));
</script>

<template>
  <rect
    :x="cx - (width + stroke_width) / 2"
    :y="cy - (height + stroke_width) / 2"
    stroke="gray"
    :stroke-width="stroke_width"
    :width="width + stroke_width"
    :height="height + stroke_width"
    fill-opacity="0.0"
    opacity="0.6"
  />
  <rect
    v-for="(color, index) of colors"
    :key="index"
    :x="cx - width / 2"
    :y="cy - height / 2 + segmentHeight * index"
    :fill="color"
    :width="width"
    :height="segmentHeight"
    opacity="0.6"
  />
</template>
