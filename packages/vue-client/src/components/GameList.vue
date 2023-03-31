<script setup lang="ts">
import { ref, computed } from "vue";
import { useFetch } from "@vueuse/core";
import type { GameResponse } from "@ogfcommunity/variants-shared";
const countOptions = [10, 15, 25, 50];
const count = ref(countOptions[0]);
const offset = ref(0);
const url = computed(
  () => `/api/games?count=${count.value ?? 0}&offset=${offset.value ?? 0}`
);
const { data: games } = await useFetch(url, { refetch: true })
  .get()
  .json<GameResponse[]>();
const first = () => {
  offset.value = 0;
};
const previous = () => {
  offset.value = Math.max(0, offset.value - count.value);
};
const next = () => {
  offset.value += count.value;
};
</script>

<template>
  <ul>
    <li v-for="game in games" :key="game.id">
      <RouterLink v-bind:to="{ name: 'game', params: { gameId: game.id } }">
        {{ game.id }}
      </RouterLink>
    </li>
  </ul>
  <button @click="first()" :disabled="offset === 0">First</button>
  <button @click="previous()" :disabled="offset === 0">Previous</button>
  <button @click="next()" :disabled="games?.length !== count">Next</button>
  <label>
    Show:
    <select v-model="count">
      <option v-for="option in countOptions" :key="option" :value="option">
        {{ option }}
      </option>
    </select>
  </label>
</template>
