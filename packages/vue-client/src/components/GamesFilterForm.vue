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
const selectedVariant: Ref<string | null> = ref(null);
const user = useCurrentUser();
const onlyMyGames = ref(false);

const filter = computed(() => {
  const gamesFilter: GamesFilter = {
    user_id: onlyMyGames.value ? user.value?.id ?? null : null,
    variant: selectedVariant.value,
  };
  return gamesFilter;
});
</script>

<template>
  <form @change="emitFilter" class="gamesFilterForm">
    <div class="labelledContainer">
      <label>Variant filter</label>
      <select v-model="selectedVariant">
        <option value="null">All variants</option>
        <option v-for="variant in variants" :key="variant">
          {{ variant }}
        </option>
      </select>
    </div>

    <div v-if="user" class="myGamesToggle">
      <label for="onlyMyGamesToggle">games that I play </label>
      <input id="onlyMyGamesToggle" type="checkbox" v-model="onlyMyGames" />
    </div>
  </form>
</template>

<style>
.gamesFilterForm {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
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
