<script setup lang="ts">
import GameCreationForm from "@/components/GameCreation/GameCreationForm.vue";
import GameList from "@/components/GameList.vue";
import { SITE_NAME } from "@ogfcommunity/variants-shared";
</script>

<template>
  <main>
    <div class="grid-page-layout">
      <div>
        <h2>Welcome to {{ SITE_NAME }}!</h2>
        <GameCreationForm />
      </div>
      <div>
        <GameList />
      </div>
    </div>
  </main>
</template>
