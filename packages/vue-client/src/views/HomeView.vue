<script setup lang="ts">
  import TheWelcome from "@/components/TheWelcome.vue";
  import GameCreationForm from "@/components/GameCreationForm.vue";
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
