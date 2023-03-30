<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { useStore } from "../stores/games";

const store = useStore();
const { games } = storeToRefs(store);

const countOptions = [10, 15, 25, 50];
const count = ref(countOptions[0]);
const offset = ref(0);

store.fetchGames(count.value, offset.value);

const fetchGames = () => store.fetchGames(count.value, offset.value);

const first = () => {
  offset.value = 0;
  fetchGames();
};

const previous = () => {
  offset.value = Math.max(0, offset.value - count.value);
  fetchGames();
};

const next = () => {
  offset.value += count.value;
  fetchGames();
};
</script>

<template>
  <div>
    <ul>
      <li v-for="game in games" :key="game.id">
        <RouterLink v-bind:to="{ name: 'game', params: { gameId: game.id } }">
          {{ game.id }}
        </RouterLink>
      </li>
    </ul>
    <button @click="first()" :disabled="offset === 0">First</button>
    <button @click="previous()" :disabled="offset === 0">Previous</button>
    <button @click="next()" :disabled="store.games.length !== count">
      Next
    </button>
    <label>
      Show:
      <select v-model="count" @change="fetchGames()">
        <option v-for="option in countOptions" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
    </label>
  </div>
</template>
