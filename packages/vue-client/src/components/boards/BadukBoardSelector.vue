<script setup lang="ts">
import {
  BadukConfig,
  BadukState,
  GridBadukConfig,
  NewBadukConfig,
  isGridBadukConfig,
} from "@ogfcommunity/variants-shared";
import { computed } from "vue";
import BadukGraphBoard from "./BadukGraphBoard.vue";
import BadukBoard from "./BadukBoard.vue";

const props = defineProps<{
  gamestate: BadukState;
  config: BadukConfig;
}>();

const emit = defineEmits<{
  (e: "move", move: string): void;
}>();

function move(move: string) {
  emit("move", move);
}

const isGridBoard = computed(() => isGridBadukConfig(props.config));
</script>

<template>
  <BadukGraphBoard
    v-if="!isGridBoard"
    :gamestate="$props.gamestate"
    :config="$props.config as NewBadukConfig"
    @move="move"
  />
  <BadukBoard
    v-if="isGridBoard"
    :gamestate="$props.gamestate"
    :config="$props.config as GridBadukConfig"
    @move="move"
  />
</template>
