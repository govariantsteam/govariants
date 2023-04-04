<script setup lang="ts">
import { ref, type Ref, watch } from "vue";
import {
  getVariantList,
  getDefaultConfig,
  type BadukConfig,
  type ParallelGoConfig,
} from "@ogfcommunity/variants-shared";
import * as requests from "@/requests";
import router from "@/router";
import BadukConfigFormVue from "./BadukConfigForm.vue";
import type { BadukWithAbstractBoardConfig } from "@ogfcommunity/variants-shared/src/badukWithAbstractBoard/badukWithAbstractBoard";
import BadukWithAbstractBoardConfigFormVue from "./BadukWithAbstractBoardConfigForm.vue";
import ParallelGoConfigFormVue from "./ParallelGoConfigForm.vue";

const variants: string[] = getVariantList();
const variant: Ref<string> = ref(variants.length ? variants[0] : "");
let config: object;
const configString: Ref<string> = ref("");
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
    <template
      v-if="
        variant === 'baduk' || variant === 'phantom' || variant == 'capture'
      "
    >
      <BadukConfigFormVue
        :initialConfig="getDefaultConfig(variant) as BadukConfig"
        @configChanged="setConfig"
      />
      <button v-on:click="createGame">Create Game</button>
    </template>
    <template v-else-if="variant === 'badukWithAbstractBoard'">
      <BadukWithAbstractBoardConfigFormVue
        :initialConfig="getDefaultConfig(variant) as BadukWithAbstractBoardConfig"
        @configChanged="setConfig"
      />
      <button v-on:click="createGame">Create Game</button>
    </template>
    <template v-else-if="variant === 'parallel'">
      <ParallelGoConfigFormVue
        :initialConfig="getDefaultConfig(variant) as ParallelGoConfig"
        @configChanged="setConfig"
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
