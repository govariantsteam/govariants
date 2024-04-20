<script setup lang="ts">
import GameCreationForm from "@/components/GameCreation/GameCreationForm.vue";
import GameList from "@/components/GameList.vue";
import { SITE_NAME } from "@shared";
</script>

<template>
  <main>
    <h2>Welcome to {{ SITE_NAME }}!</h2>
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
