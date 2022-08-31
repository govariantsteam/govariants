<script setup lang="ts">
const colors = ["red", "blue", "yellow"];
const sections = colors.length;
const angle = (Math.PI * 2) / sections;
const angle_degrees = 360 / sections;
const rad = 300;
const hrad = rad / 2;

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

const back_semi = `M0 0A${hrad} ${hrad} 0 0 1 ${rad} 0`;
const outer_arc = `A${rad} ${rad} 0 0 0${Math.cos(angle) * rad} ${
  -Math.sin(angle) * rad
}`;
const front_semi = `A${hrad} ${hrad} 0 0 0 0 0z`;
const section_path = `${back_semi}${outer_arc}${front_semi}`;
</script>

<template>
  <circle
    cx="0"
    cy="0"
    v-bind:r="rad"
    v-if="colors.length === 1"
    v-bind:fill="colors[0]"
  />
  <g v-else>
    <path
      v-for="(color, idx) in colors"
      v-bind:key="idx"
      v-bind:fill="color"
      v-bind:d="section_path"
      v-bind:transform="`rotate(${angle_degrees * idx} 0 0)`"
    />
  </g>
</template>
