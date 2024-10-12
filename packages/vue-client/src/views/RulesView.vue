<script setup lang="ts">
import FractionalRules from "@/components/RuleDescriptions/FractionalRules.vue";
import { computed } from "vue";

const props = defineProps<{ variant: string }>();

const variantRulesMapping: Record<string, object> = {
  fractional: FractionalRules,
};

const variantRulesComponent = computed(
  () => variantRulesMapping[props.variant],
);

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
    <p v-if="!variantRulesComponent">Under Construction</p>
    <component
      v-if="variantRulesComponent"
      v-bind:is="variantRulesComponent"
    ></component>
  </div>
</template>

<style>
.rules-page {
  font-family: "helvetica", "arial", "sans-serif";
}
strong,
h1,
h2 {
  font-weight: bold;
}
</style>
