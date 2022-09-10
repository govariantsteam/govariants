<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  // TODO: support "TR", "SQ"
  /** SGF Markup properties: https://www.red-bean.com/sgf/properties.html
   * - Circle (CR)
   * - X Mark (MA)
   * - Triangle (TR) [Not yet implemented]
   * - Square (SQ) [Not yet implemented]
   */
  annotation: "CR" | "MA";
  r: number;
  cx: number;
  cy: number;
}>();

const r = computed(() => props.r * 0.6);
</script>

<template>
  <g v-if="props.annotation === 'CR'">
    <circle
      :r="r"
      :cx="props.cx"
      :cy="props.cy"
      stroke="black"
      stroke-width="0.1"
      fill="none"
    />
  </g>
  <g v-if="props.annotation === 'MA'">
    <line
      :x1="props.cx - r"
      :y1="props.cy - r"
      :x2="props.cx + r"
      :y2="props.cy + r"
      stroke="black"
      stroke-width="0.1"
    />
    <line
      :x1="props.cx - r"
      :y1="props.cy + r"
      :x2="props.cx + r"
      :y2="props.cy - r"
      stroke="black"
      stroke-width="0.1"
    />
  </g>
</template>
