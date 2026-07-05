<script setup lang="ts">
import { useCurrentUser } from "@/stores/user";
import {
  getVariantList,
  type GamesFilter,
} from "@govariants/shared";
import { ref } from "vue";

const filter = defineModel<GamesFilter>();

const variants: string[] = getVariantList();

const variant = ref(filter.value?.variant ?? "");

const user = useCurrentUser();
const onlyMyGames = ref(
  filter.value?.user_id === user.value?.id ? true : false,
);

function createFilter(): GamesFilter {
  const filter: GamesFilter = {};
  if (variant.value !== "") {
    filter.variant = variant.value;
  }
  if (onlyMyGames.value && user.value) {
    filter.user_id = user.value.id;
  }
  return filter;
}

function updateFilter(): void {
  filter.value = createFilter();
}
</script>

<template>
  <h3>{{ $t("game-filter.title") }}</h3>
  <form class="gamesFilterForm" @change="updateFilter">
    <select v-model="variant">
      <option value="">{{ $t("game-filter.all-variants") }}</option>
      <option v-for="variantOption in variants" :key="variantOption">
        {{ variantOption }}
      </option>
    </select>

    <div v-if="user" class="myGamesToggle">
      <label for="onlyMyGamesToggle">{{ $t("game-filter.my-games") }}</label>
      <input id="onlyMyGamesToggle" v-model="onlyMyGames" type="checkbox" />
    </div>
  </form>
</template>

<style scoped>
.gamesFilterForm {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}
.myGamesToggle {
  label {
    cursor: pointer;
  }
  input {
    cursor: pointer;
  }
}
</style>
