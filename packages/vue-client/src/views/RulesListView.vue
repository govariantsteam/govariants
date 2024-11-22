<script setup lang="ts">
import { toUpperCaseFirstLetter } from "@/utils/format-utils";
import { getVariantsWithRulesDescription } from "@ogfcommunity/variants-shared";
import { RouterLink } from "vue-router";

const variantsWithRulesDescription = getVariantsWithRulesDescription();
</script>

<template>
  <main>
    <h1>Rule Descriptions</h1>
    <div class="rule-links-container">
      <RouterLink
        v-for="variant in variantsWithRulesDescription"
        :key="variant"
        class="rules-link"
        v-bind:to="{ name: 'rules', params: { variant: variant } }"
      >
        {{ toUpperCaseFirstLetter(variant) }}
      </RouterLink>
    </div>
  </main>
</template>

<style scoped>
main {
  padding: 0 2rem;
}
.rule-links-container {
  display: flex;
  flex-direction: row;
  flex-flow: wrap;
}
.rules-link {
  border: 1px solid var(--color-border);
  margin: 15px;
  text-align: center;
  padding: 1rem 2rem;
  font-size: large;
  background-color: var(--color-background-soft);
  &:hover {
    background-color: var(--color-background-mute);
  }
}
</style>
