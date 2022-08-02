<script setup lang="ts">
  import { storeToRefs } from "pinia";
  import { ref } from "vue";
  import { getVariantList } from "@ogfcommunity/variants-shared";
  import { useStore } from "../stores/games";
  import router from "@/router";

  const store = useStore();

  const variants = getVariantList();
  const variant = ref(variants.length ? variants[0] : "");
  const config = ref('{ "width": 19, "height": 19, "komi": 5.5 }');

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
        <option v-for="variant in variants">{{ variant }}</option>
      </select>
    </div>
    <div>
      <label>Config: </label>
      <textarea v-model="config"></textarea>
    </div>
    <button v-on:click="createGame()">Create Game</button>
  </div>
</template>
