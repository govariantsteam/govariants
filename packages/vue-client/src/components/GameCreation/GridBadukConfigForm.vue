<script setup lang="ts">
import {
  NewBadukConfig,
  NewGridBadukConfig,
} from "@ogfcommunity/variants-shared";
import BadukConfigForm from "./BadukConfigForm.vue";

const props = defineProps<{
  initialConfig: NewGridBadukConfig;
}>();

const emit = defineEmits<{
  (e: "configChanged", config: NewBadukConfig): void;
}>();

function emitConfigChange(config: NewBadukConfig) {
  emit("configChanged", config);
}
</script>

<template>
  <BadukConfigForm
    v-bind:initial-config="$props.initialConfig"
    v-bind:grid-only="true"
    @config-changed="emitConfigChange"
  />
</template>
