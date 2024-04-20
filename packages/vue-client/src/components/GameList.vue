<script setup lang="ts">
import { ref, computed, type Ref } from "vue";
import { useFetch } from "@vueuse/core";
import {
  type GameResponse,
  type GamesFilter,
  gamesFilterToUrlParams,
} from "@shared";
import GameListItem from "@/components/GameListItem.vue";
import GameListItemFallback from "@/components/GameListItemFallback.vue";
import GamesFilterForm from "@/components/GamesFilterForm.vue";
import VErrorBoundary from "vue-error-boundary";

const countOptions = [10, 15, 25, 50];
const count = ref(countOptions[0]);
const offset = ref(0);
const filter: Ref<GamesFilter> = ref({});
const url = computed(
  () =>
    `/api/games?count=${count.value ?? 0}&offset=${offset.value ?? 0}` +
    gamesFilterToUrlParams(filter.value),
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
function setFilter(gamesFilter: GamesFilter) {
  filter.value = gamesFilter;
}
</script>

<template>
  <GamesFilterForm v-on:filter-change="setFilter"></GamesFilterForm>
  <hr />
  <ul>
    <template v-for="game in games" :key="game.id">
      <VErrorBoundary stop-propagation>
        <template #boundary="{ hasError, error }">
          <GameListItemFallback
            v-if="hasError"
            :error="error.message"
            :variant="game.variant"
            :game-id="game.id"
          />
          <GameListItem v-else :game="game" />
        </template>
      </VErrorBoundary>
    </template>
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

<style scoped>
ul {
  padding: 0;
}
</style>
