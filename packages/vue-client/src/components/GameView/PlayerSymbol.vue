<script setup lang="ts">
import { getPlayerColors } from "@ogfcommunity/variants-shared";
import TaegeukStone from "../TaegeukStone.vue";
import { computed } from "vue";

const props = defineProps<{
  variant: string;
  player_nr: number;
  config: object | undefined;
}>();

const colors = computed(() =>
  props.config
    ? getPlayerColors(props.variant, props.config, props.player_nr)
    : [],
);
</script>

<template>
  <svg v-bind:viewBox="`0 0 2 2`">
    <TaegeukStone
      v-if="colors"
      :colors="colors"
      :r="1"
      :cx="1"
      :cy="1"
    ></TaegeukStone>
  </svg>
</template>

<style scoped>
svg {
  margin: 10px;
  width: 40px;
  height: 40px;
  filter: drop-shadow(3px 5px 6px rgb(0 0 0 / 0.4));
}
</style>
