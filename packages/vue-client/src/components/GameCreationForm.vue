<script setup lang="ts">
import { ref, computed, type Ref, type ComputedRef } from "vue";
import {
  getVariantList,
  getDefaultConfig,
} from "@ogfcommunity/variants-shared";
import { useStore } from "../stores/games";
import router from "@/router";

const store = useStore();

const variants: string[] = getVariantList();
const variant: Ref<string> = ref(variants.length ? variants[0] : "");
const config: ComputedRef<string> = computed(() => {
  return JSON.stringify(getDefaultConfig(variant.value), null, 2);
});

const createGame = async () => {
  const game = await store.createGame(variant.value, config.value);
  console.log(game);
  router.push({ name: "game", params: { gameId: game.id } });
};
</script>

<template>
  <div className="game-creation-form">
    <h3>Create a game</h3>
    <div>
      <label>Variant:</label>
      <select v-model="variant">
        <option v-for="variant in variants" :key="variant">
          {{ variant }}
        </option>
      </select>
    </div>
    <div>
      <label>Config: </label>
      <textarea v-model="config"></textarea>
    </div>
    <button v-on:click="createGame()">Create Game</button>
  </div>
</template>

<style>
textarea {
  width: 300px;
  height: 150px;
  display: block;
}
</style>
