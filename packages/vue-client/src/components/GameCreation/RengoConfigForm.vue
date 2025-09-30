<script setup lang="ts">
import { config_form_map } from "@/config_form_map";
import {
  getDefaultConfig,
  getVariantList,
  makeGameObject,
  RengoConfig,
} from "@ogfcommunity/variants-shared";
import { ref, watch, type Component } from "vue";

const props = defineProps<{
  initialConfig: RengoConfig;
}>();

const variants: string[] = getVariantList();

const subVariant = ref(props.initialConfig.subVariant);
let variantConfigForm: Component;

function maybeUpdateTeamsArray() {
  const subGameNumPlayers = makeGameObject(
    subVariant.value,
    subVariantConfig.value,
  ).numPlayers();
  if (subGameNumPlayers !== teamSizes.value.length) {
    teamSizes.value = new Array(subGameNumPlayers).fill(2);
  }
}

watch(subVariant, () => {
  subVariantConfig.value = getDefaultConfig(subVariant.value);
  maybeUpdateTeamsArray();
  emitConfigChange();
  variantConfigForm = config_form_map[subVariant.value];
});

const subVariantConfig = ref({ ...props.initialConfig.subVariantConfig });
const teamSizes = ref(props.initialConfig.teamSizes);

function setSubConfig(subconfig: object): void {
  subVariantConfig.value = subconfig;
  maybeUpdateTeamsArray();
  emitConfigChange();
}

const emit = defineEmits<{
  (e: "configChanged", config: RengoConfig): void;
}>();

function emitConfigChange() {
  const config: RengoConfig = {
    subVariant: subVariant.value,
    subVariantConfig: subVariantConfig.value,
    teamSizes: teamSizes.value,
  };
  emit("configChanged", config);
}
</script>

<template>
  <div class="config-form-column">
    <label>Subvariant</label>
    <select v-model="subVariant">
      <option v-for="variant in variants" :key="variant">
        {{ variant }}
      </option>
    </select>
    <form @change="emitConfigChange">
      <template v-for="(_, index) in teamSizes" :key="index">
        <label>Size of team {{ index }}</label>
        <input type="number" min="1" v-model="teamSizes[index]" />
      </template>

      <component
        v-if="variantConfigForm"
        :is="variantConfigForm"
        :initialConfig="getDefaultConfig(subVariant)"
        v-on:configChanged="setSubConfig"
      />
    </form>
  </div>
</template>

<style scoped>
label {
  display: block;
}
</style>
