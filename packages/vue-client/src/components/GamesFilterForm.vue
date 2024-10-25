<script setup lang="ts">
import { useCurrentUser } from "@/stores/user";
import {
  getVariantList,
  type GamesFilter,
} from "@ogfcommunity/variants-shared";
import { type Ref, ref, computed } from "vue";

const emit = defineEmits<{ (e: "filterChange", filter: GamesFilter): void }>();
function emitFilter() {
  emit("filterChange", filter.value);
}

const variants: string[] = getVariantList();
const selectedVariant: Ref<string> = ref("");
const user = useCurrentUser();
const onlyMyGames = ref(false);

const filter = computed(() => {
  const gamesFilter: GamesFilter = {
    user_id: onlyMyGames.value ? user.value?.id : undefined,
    variant: selectedVariant.value,
  };
  return gamesFilter;
});
</script>

<template>
  <h3>Filter games</h3>
  <form @change="emitFilter" class="gamesFilterForm">
    <select v-model="selectedVariant">
      <option value="">All variants</option>
      <option v-for="variant in variants" :key="variant">
        {{ variant }}
      </option>
    </select>

    <div v-if="user" class="myGamesToggle">
      <label for="onlyMyGamesToggle">games that I play </label>
      <input id="onlyMyGamesToggle" type="checkbox" v-model="onlyMyGames" />
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
