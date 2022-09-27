<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { socket } from "../requests";

const connected = ref(socket.connected);
const last_pong = ref("-");
onMounted(() => {
  socket.on("connect", () => {
    connected.value = true;
  });
  socket.on("disconnect", () => {
    connected.value = false;
  });
  socket.on("pong", () => {
    last_pong.value = new Date().toISOString();
  });
});

onUnmounted(() => {
  socket.off("connect");
  socket.off("disconnect");
  socket.off("pong");
});
</script>

<template>
  <div className="socket-test">
    <h3>socket.io tests...</h3>
    <p>{{ `Connected: ${connected}` }}</p>
    <p>{{ `Last pong: ${last_pong}` }}</p>
    <button @click="socket.emit('ping')">Send ping</button>
  </div>
</template>
