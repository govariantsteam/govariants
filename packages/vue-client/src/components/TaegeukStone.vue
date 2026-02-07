<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  colors: string[];
  r: number;
  cx: number;
  cy: number;
}>();

const section_path = computed(() => {
  const sections = props.colors.length;
  const angle = (Math.PI * 2) / sections;

  const rad = props.r;
  const hrad = rad / 2;

  const back_semi = `M0 0A${hrad} ${hrad} 0 0 1 ${rad} 0`;
  const outer_arc = `A${rad} ${rad} 0 0 0${Math.cos(angle) * rad} ${
    -Math.sin(angle) * rad
  }`;
  const front_semi = `A${hrad} ${hrad} 0 0 0 0 0z`;
  return `${back_semi}${outer_arc}${front_semi}`;
});

const angle_degrees = computed(() => {
  const sections = props.colors.length;
  return 360 / sections;
});

//        _..oo8"""Y8b.._
//      .88888888o.    "Yb.
//    .d88888888888b BACK "b.
//   o88888888888888 SEMI   "b
//  d88888888888888P         'b
//  88888888888888"           8
// (88DWB8888888P             8) OUTER
//  8888888888P               8  ARC
//  Y88888888P               .P
//   Y888888(    FRONT      oP
//    "Y88888b   SEMI     oP"
//      "Y8888o._     _.oP"
//        `""Y888boodP""'
</script>

<template>
  <circle
    v-if="colors.length === 1"
    :cx="props.cx"
    :cy="props.cy"
    :r="props.r"
    :fill="colors[0]"
  />
  <g v-else :transform="`translate(${props.cx} ${props.cy})`">
    <path
      v-for="(color, idx) in colors"
      :key="idx"
      :fill="color"
      :d="section_path"
      :transform="`rotate(${angle_degrees * idx} 0 0)`"
    />
  </g>
</template>
