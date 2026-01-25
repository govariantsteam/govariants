<script setup lang="ts">
import { getPlayingTable } from "@/playing_table_map";
import { IHigherOrderConfig, uiTransform } from "@ogfcommunity/variants-shared";
import { computed } from "vue";

const props = defineProps<{
  config: IHigherOrderConfig;
  gamestate: object;
  displayed_round: number;
}>();

const emit = defineEmits<{
  (e: "move", pos: string): void;
}>();

function emitMove(move: string): void {
  emit("move", move);
}

const variantPlayingTable = computed(() =>
  getPlayingTable(props.config.subVariant),
);

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
    :is="variantPlayingTable"
    v-if="variantPlayingTable"
    :gamestate="transformedGameData.gamestate"
    :config="transformedGameData.config"
    :displayed_round="props.displayed_round"
    @move="emitMove"
  />
</template>
