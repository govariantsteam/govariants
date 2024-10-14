<script setup lang="ts">
import { computed } from "vue";
import TaegeukStone from "../TaegeukStone.vue";

const props = defineProps<{
  variant: string;
  config: unknown;
  gamestate: unknown;
  player_nr: number;
}>();

const colors = computed(() => {
  if (
    [
      "baduk",
      "badukWithAbstractBoard",
      "phantom",
      "capture",
      "tetris",
      "pyramid",
      "thue-morse",
      "freeze",
      "keima",
      "drift",
      "quantum",
    ].includes(props.variant)
  ) {
    return [props.player_nr % 2 === 0 ? "black" : "white"];
  }

  if (props.variant === "chess") {
    return [props.player_nr % 2 === 0 ? "white" : "black"];
  }

  if (props.variant === "fractional") {
    // TODO: parse config to determine the players colors.
    // unfortunately I can't figure out how to do it, because
    // props.config is a reactive ref object. I don't understand why,
    // because we also pass the config to the variantGameView.
  }

  return undefined;
});
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
