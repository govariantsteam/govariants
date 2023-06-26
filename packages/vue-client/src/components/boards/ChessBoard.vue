<script setup lang="ts">
import { Chessground } from "chessground";
import { ref, onMounted, watch } from "vue";
import "vue3-chessboard/style.css";

const props = defineProps<{
  gamestate: { fen: string };
  config: unknown;
}>();

const emit = defineEmits<{
  (e: "move", move: string): void;
}>();

let ground: ReturnType<typeof Chessground> | null = null;

function updateBoard() {
  ground?.set({ fen: props.gamestate.fen });
}

function onMove(source: string, target: string) {
  // Keep the board in its prior state until the server has verified the move
  updateBoard();
  // send the move to the server
  emit("move", `${source}-${target}`);
}

const container = ref<HTMLElement | null>(null);
onMounted(() => {
  if (!container.value) {
    throw new Error("Failed to mount chess board container");
  }
  ground = Chessground(container.value, {
    fen: props.gamestate.fen,
    events: {
      move: onMove,
    },
  });
});

watch(props, updateBoard);
</script>

<template>
  <div ref="container" class="chessboard" />
</template>

<style scoped>
.chessboard {
  width: 100%;
  aspect-ratio: 1 / 1;
  height: unset;
  position: relative;
}
</style>
