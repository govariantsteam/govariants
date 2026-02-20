<script setup lang="ts">
import { ref, type Ref, watch, computed } from "vue";
import {
  getVariantList,
  getDefaultConfig,
  type ITimeControlConfig,
  BoardPattern,
  getTimeHandling,
  getDescription,
} from "@ogfcommunity/variants-shared";
import * as requests from "@/requests";
import router from "@/router";
import { config_form_map } from "@/config_form_map";
import TimeControlConfigForm from "./TimeControlConfigForm.vue";

interface IConfigWithOptionalTimeControl {
  time_control?: ITimeControlConfig;
}

const variants: string[] = getVariantList();
const variant: Ref<string> = ref(variants.length ? variants[0] : "");
let config: IConfigWithOptionalTimeControl;
let timeControlConfig: ITimeControlConfig | null = null;
const configString: Ref<string> = ref("");
const variantConfigForm = computed(() => config_form_map[variant.value]);
const shortDescription = computed(() => getDescription(variant.value));
watch(
  variant,
  () => {
    config = getDefaultConfig(variant.value);
    configString.value = JSON.stringify(config, null, 2);
  },
  { immediate: true },
);

const createGame = async () => {
  if (
    !config ||
    typeof config !== "object" ||
    (timeControlConfig !== null &&
      typeof timeControlConfig.mainTimeMS !== "number")
  ) {
    console.log("game creation form is invalid");
    return;
  }
  //ToDo: add form validation

  // TODO: improve on the type checking here, add backend validation
  if (
    "pattern" in config &&
    "width" in config &&
    "height" in config &&
    config.pattern === BoardPattern.Sierpinsky &&
    Math.min(Number(config.width), Number(config.height)) > 6
  ) {
    alert("board size is too big");
    return;
  }

  try {
    const game = await requests.post("/games", {
      variant: variant.value,
      config: { ...config, time_control: timeControlConfig },
    });
    router.push({ name: "game", params: { gameId: game.id } });
  } catch (e) {
    alert(e);
  }
};

const parseConfigThenCreateGame = async () => {
  config = JSON.parse(configString.value);
  await createGame();
};

const setConfig = (newConfig: object) => {
  config = newConfig;
};
const setTimeControlConfig = (
  newTimeControlConfig: ITimeControlConfig | null,
) => {
  timeControlConfig = newTimeControlConfig;
};
const hasTimeConfigForm = computed(
  () => getTimeHandling(variant.value) !== "none",
);
</script>

<template>
  <div className="game-creation-form">
    <h3>Create a game</h3>
    <div>
      <div class="col">
        <label>Variant</label>
        <select v-model="variant">
          <option v-for="variant in variants" :key="variant">
            {{ variant }}
          </option>
        </select>
        <span class="variant-description">{{ shortDescription }}</span>
      </div>
    </div>
    <h3>Config</h3>
    <template v-if="variantConfigForm">
      <component
        :is="variantConfigForm"
        :initial-config="getDefaultConfig(variant)"
        @config-changed="setConfig"
      />
      <TimeControlConfigForm
        v-if="hasTimeConfigForm"
        @config-changed="setTimeControlConfig"
      />
      <button class="large-button" @click="createGame">Create Game</button>
    </template>
    <template v-else>
      <textarea v-model="configString" />
      <TimeControlConfigForm
        v-if="hasTimeConfigForm"
        @config-changed="setTimeControlConfig"
      />
      <button class="large-button" @click="parseConfigThenCreateGame">
        Create Game
      </button>
    </template>
  </div>
</template>

<style scoped>
textarea {
  width: 300px;
  height: 150px;
  display: block;
}
.game-creation-form {
  margin-bottom: 0.5rem;
  .large-button {
    margin-top: 5px;
    font-size: large;
  }
}
.variant-description {
  white-space: pre-line;
  padding: 4px 0;
}
</style>
