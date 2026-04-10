<script setup lang="ts">
import { isErrorResult } from "@ogfcommunity/variants-shared";
import GameListItem from "@/components/GameListItem.vue";
import GameListItemFallback from "@/components/GameListItemFallback.vue";
import GamesFilterForm from "@/components/GamesFilterForm.vue";
import VErrorBoundary from "vue-error-boundary";
import { gameListStore } from "@/stores/game-list-store";
import { storeToRefs } from "pinia";

const countOptions = [10, 15, 25, 50];

const store = gameListStore();
store.load();
const games = storeToRefs(store).games;
</script>

<template>
  <GamesFilterForm @filter-change="store.setFilter" />
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
  <button :disabled="store.pageNumber === 0" @click="store.firstPage()">
    First
  </button>
  <button :disabled="store.pageNumber === 0" @click="store.previousPage()">
    Previous
  </button>
  <button
    :disabled="games?.length !== store.pageSize"
    @click="store.nextPage()"
  >
    Next
  </button>
  <label>
    Show:
    <select
      @change="
        ($event) =>
          store.setPageSize(Number(($event.target as any)?.value ?? 0))
      "
    >
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
