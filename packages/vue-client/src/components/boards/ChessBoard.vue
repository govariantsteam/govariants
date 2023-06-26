<script setup lang="ts">
import { Chessground } from "chessground";
import { ref, onMounted } from "vue";
import "vue3-chessboard/style.css";

const props = defineProps<{
  gamestate: { fen: string };
  config: unknown;
}>();

const emit = defineEmits<{
  (e: "move", move: string): void;
}>();

function onMove(move: MoveEvent) {
  emit("move", `${move.from}-${move.to}`);
}

const boardConfig = {
  fen: props.gamestate.fen,
};

const container = ref(null);
let ground = null;
onMounted(() => {
  ground = Chessground(container.value, {});
});
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
