<script setup lang="ts">
import { computed, type Ref } from "vue";
import { useFetch } from "@vueuse/core";
import {
  type GameErrorResponse,
  type GameInitialResponse,
  type GamesFilter,
  gamesFilterToUrlParams,
  isErrorResult,
} from "@ogfcommunity/variants-shared";
import GameListItem from "@/components/GameListItem.vue";
import GameListItemFallback from "@/components/GameListItemFallback.vue";
import GamesFilterForm from "@/components/GamesFilterForm.vue";
import VErrorBoundary from "vue-error-boundary";
import { LocationQueryRaw, useRoute, useRouter } from "vue-router";

const pageSizeOptions = [10, 15, 25, 50];

const route = useRoute();
const router = useRouter();

const page = computed({
  get: () => Number(route.query.page) || 0,
  set: (value) => {
    router.replace({
      query: { ...route.query, page: value },
    });
  },
});

const pageSize = computed({
  get: () => Number(route.query.pageSize) || pageSizeOptions[0],
  set: (value) =>
    router.replace({
      query: { ...route.query, pageSize: value },
    }),
});

const filter: Ref<GamesFilter> = computed({
  get: (): GamesFilter => {
    const obj: GamesFilter = {};
    if (route.query.user_id) obj.user_id = String(route.query.user_id);
    if (route.query.variant) obj.variant = String(route.query.variant);
    return obj;
  },
  set: (newFilter) => {
    const newQuery: LocationQueryRaw = { ...route.query };
    if (newFilter.variant) newQuery.variant = newFilter.variant;
    else delete newQuery["variant"];

    if (newFilter.user_id) newQuery.user_id = newFilter.user_id;
    else delete newQuery["user_id"];

    router.replace({ query: newQuery });
  },
});

const offset = computed(() => pageSize.value * page.value);
const url = computed(
  () =>
    `/api/games?count=${pageSize.value ?? 0}&offset=${offset.value ?? 0}` +
    gamesFilterToUrlParams(filter.value),
);
const { data: games } = await useFetch(url, { refetch: true })
  .get()
  .json<(GameInitialResponse | GameErrorResponse)[]>();

const first = () => {
  page.value = 0;
};
const previous = () => {
  if (page.value < 1) return;
  page.value--;
};
const next = () => {
  page.value++;
};
</script>

<template>
  <GamesFilterForm v-model:filter="filter" />
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
  <button :disabled="games?.length !== pageSize" @click="next()">Next</button>
  <label>
    Show:
    <select v-model="pageSize">
      <option v-for="option in pageSizeOptions" :key="option" :value="option">
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
