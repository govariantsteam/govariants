<script setup lang="ts">
import { ref, type Ref, watch } from "vue";
import {
  getVariantList,
  getDefaultConfig,
} from "@ogfcommunity/variants-shared";
import * as requests from "@/requests";
import router from "@/router";

const variants: string[] = getVariantList();
const variant: Ref<string> = ref(variants.length ? variants[0] : "");
const config: Ref<string> = ref("");
watch(
  variant,
  () => {
    config.value = JSON.stringify(getDefaultConfig(variant.value), null, 2);
  },
  { immediate: true }
);

const createGame = async () => {
  const game = await requests.post("/games", {
    variant: variant.value,
    config: JSON.parse(config.value),
  });
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
