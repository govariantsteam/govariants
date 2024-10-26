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

const segmentHeight = computed(
  () => +(height / props.colors.length).toFixed(3),
);
</script>

<template>
  <rect
    v-bind:x="cx - (width + stroke_width) / 2"
    v-bind:y="cy - (height + stroke_width) / 2"
    stroke="gray"
    v-bind:stroke-width="stroke_width"
    v-bind:width="width + stroke_width"
    v-bind:height="height + stroke_width"
    fill-opacity="0.0"
    opacity="0.6"
  />
  <rect
    v-for="(color, index) of colors"
    v-bind:x="cx - 0.2"
    v-bind:y="cy - 0.2 + segmentHeight * index"
    v-bind:fill="color"
    v-bind:width="width"
    v-bind:height="segmentHeight"
    opacity="0.6"
  />
</template>
