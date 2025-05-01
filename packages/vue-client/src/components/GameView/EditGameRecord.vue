<script setup lang="ts">
import { ref, watchEffect } from "vue";
import * as requests from "@/requests";

const props = defineProps<{ gameId: string }>();
const gameRecord = ref();
watchEffect(async () => {
  await requests
    .get(`/gameRecord/${props.gameId}`)
    .then((result) => {
      gameRecord.value = JSON.stringify(result, undefined, 2);
      setAreaHeight();
    })
    .catch(alert);
});

async function upload(): Promise<void> {
  await requests
    .put(`/gameRecord/${props.gameId}`, JSON.parse(gameRecord.value))
    .catch(alert);
}

function setAreaHeight(): void {
  // wait once so scroll height adapts
  window.setTimeout(() => {
    const e = document.querySelector("#admin-game-edit") as HTMLElement | null;
    if (!e) return;
    e.style.height = "";
    e.style.height = e.scrollHeight + "px";
  });
}
</script>

<template>
  <div class="admin-controls">
    <h1>Admin Controls</h1>
    <textarea v-model="gameRecord" id="admin-game-edit"></textarea>
    <button v-on:click="upload">upload game record</button>
  </div>
</template>

<style lang="css" scoped>
.admin-controls {
  width: 100%;
  textarea {
    width: 100%;
  }
}
</style>
