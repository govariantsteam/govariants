<script setup lang="ts">
import GameCreationForm from "@/components/GameCreation/GameCreationForm.vue";
import GameList from "@/components/GameList.vue";
</script>

<template>
  <main>
    <h2>Welcome to Go variants!</h2>
    <div>
      <GameCreationForm />
      <hr />
      <GameList />
      <!-- <hr />
      <SocketTest />
      <hr /> -->
    </div>
  </main>
</template>
