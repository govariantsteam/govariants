<script setup lang="ts">
import { getBoard } from "@/board_map";
import { IHigherOrderConfig, uiTransform } from "@ogfcommunity/variants-shared";
import { computed } from "vue";

const props = defineProps<{
  config: IHigherOrderConfig;
  gamestate: object;
}>();

const emit = defineEmits<{
  (e: "move", pos: string): void;
}>();

function emitMove(move: string): void {
  emit("move", move);
}

const variantBoard = computed(() => getBoard(props.config.subVariant));

const transformedGameData = computed(() =>
  uiTransform(
    props.config.subVariant,
    props.config.subVariantConfig,
    props.gamestate,
  ),
);
</script>

<template>
  <component
    :is="variantBoard"
    v-if="variantBoard"
    :gamestate="transformedGameData.gamestate"
    :config="transformedGameData.config"
    @move="emitMove"
  />
</template>
