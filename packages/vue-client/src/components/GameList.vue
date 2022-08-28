<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useStore } from "../stores/games";

const store = useStore();
const { games } = storeToRefs(store);

store.fetchGames();
</script>

<template>
  <ul>
    <li v-for="game in games" :key="game.id">
      <RouterLink v-bind:to="{ name: 'game', params: { gameId: game.id } }">
        {{ game.id }}
      </RouterLink>
    </li>
  </ul>
</template>
