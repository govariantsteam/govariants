<script setup lang="ts">
import { getRulesDescription } from "@ogfcommunity/variants-shared";
import { computed } from "vue";

const props = defineProps<{ variant: string }>();

const rulesDescription = computed(() => getRulesDescription(props.variant));

function toUpperCaseFirstLetter(string: string) {
  if (string.length === 0) {
    return "";
  }

  return string[0].toUpperCase() + string.slice(1);
}
</script>

<template>
  <div class="rules-page">
    <h1>{{ toUpperCaseFirstLetter(props.variant) }} Variant Rules</h1>
    <p v-if="!rulesDescription">Under Construction</p>
    <div v-if="rulesDescription" v-html="rulesDescription"></div>
  </div>
</template>

<style scoped>
.rules-page {
  font-family: "helvetica", "arial", "sans-serif";
}
strong,
h1,
h2 {
  font-weight: bold;
}
</style>
