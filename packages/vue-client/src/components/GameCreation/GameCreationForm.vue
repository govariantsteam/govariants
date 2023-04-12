<script setup lang="ts">
import { ref, type Ref, watch, computed } from "vue";
import {
  getVariantList,
  getDefaultConfig,
} from "@ogfcommunity/variants-shared";
import * as requests from "@/requests";
import router from "@/router";
import { config_form_map } from "@/config_form_map";

const variants: string[] = getVariantList();
const variant: Ref<string> = ref(variants.length ? variants[0] : "");
let config: object;
const configString: Ref<string> = ref("");
const variantConfigForm = computed(() => config_form_map[variant.value]);
watch(
  variant,
  () => {
    config = getDefaultConfig(variant.value);
    configString.value = JSON.stringify(config, null, 2);
  },
  { immediate: true }
);

const createGame = async () => {
  const game = await requests.post("/games", {
    variant: variant.value,
    config: config,
  });
  router.push({ name: "game", params: { gameId: game.id } });
};

const parseConfigThenCreateGame = async () => {
  config = JSON.parse(configString.value);
  await createGame();
};

const setConfig = (newConfig: object) => (config = newConfig);
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
    <label>Config: </label>
    <template v-if="variantConfigForm">
      <component
        v-bind:is="variantConfigForm"
        v-bind:initialConfig="getDefaultConfig(variant)"
        v-on:configChanged="setConfig"
      />
      <button v-on:click="createGame">Create Game</button>
    </template>
    <template v-else>
      <textarea v-model="configString"></textarea>
      <button v-on:click="parseConfigThenCreateGame">Create Game</button>
    </template>
  </div>
</template>

<style>
textarea {
  width: 300px;
  height: 150px;
  display: block;
}
</style>