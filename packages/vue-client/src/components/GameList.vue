<script setup lang="ts">
import { ref, computed, type Ref } from "vue";
import { useFetch } from "@vueuse/core";
import {
  type GameErrorResponse,
  type GameInitialResponse,
  type GamesFilter,
  gamesFilterToUrlParams,
} from "@ogfcommunity/variants-shared";
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
  .json<(GameInitialResponse | GameErrorResponse)[]>();
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
function isErrorResult(
  dto: GameInitialResponse | GameErrorResponse,
): dto is GameErrorResponse {
  const messageProperty: Exclude<
    keyof GameErrorResponse,
    keyof GameInitialResponse
  > = "errorMessage";
  return messageProperty in dto;
}
</script>

<template>
  <GamesFilterForm @filter-change="setFilter" />
  <hr />
  <ul>
    <template v-for="game in games" :key="game.id">
      <template v-if="isErrorResult(game)">
        <GameListItemFallback
          :error="game.errorMessage"
          :variant="game.variant"
          :game-id="game.id"
        />
      </template>
      <template v-else>
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
    </template>
  </ul>
  <button :disabled="offset === 0" @click="first()">First</button>
  <button :disabled="offset === 0" @click="previous()">Previous</button>
  <button :disabled="games?.length !== count" @click="next()">Next</button>
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
