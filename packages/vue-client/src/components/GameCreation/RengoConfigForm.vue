<script setup lang="ts">
import { config_form_map } from "@/config_form_map";
import {
  getDefaultConfig,
  getVariantList,
  RengoConfig,
} from "@ogfcommunity/variants-shared";
import { ref, watch, type Component } from "vue";

const props = defineProps<{
  initialConfig: RengoConfig;
}>();

const variants: string[] = getVariantList();

const subVariant = ref(props.initialConfig.subVariant);
let variantConfigForm: Component;
watch(subVariant, () => {
  subVariantConfig.value = getDefaultConfig(subVariant.value);
  emitConfigChange();
  variantConfigForm = config_form_map[subVariant.value];
});

const subVariantConfig = ref({ ...props.initialConfig.subVariantConfig });
const teamSize = ref(props.initialConfig.teamSize);

function setSubConfig(subconfig: object): void {
  subVariantConfig.value = subconfig;
  emitConfigChange();
}

const emit = defineEmits<{
  (e: "configChanged", config: RengoConfig): void;
}>();

function emitConfigChange() {
  const config: RengoConfig = {
    subVariant: subVariant.value,
    subVariantConfig: subVariantConfig.value,
    teamSize: teamSize.value,
  };
  emit("configChanged", config);
}
</script>

<template>
  <div class="config-form-column">
    <select v-model="subVariant">
      <option v-for="variant in variants" :key="variant">
        {{ variant }}
      </option>
    </select>
    <form @change="emitConfigChange">
      <label style="display: block">Players per team</label>
      <input type="number" min="1" v-model="teamSize" />
      <component
        v-if="variantConfigForm"
        :is="variantConfigForm"
        :initialConfig="getDefaultConfig(subVariant)"
        v-on:configChanged="setSubConfig"
      />
    </form>
  </div>
</template>
