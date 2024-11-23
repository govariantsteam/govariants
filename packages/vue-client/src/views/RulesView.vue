<script setup lang="ts">
import {
  getRulesDescription,
  getVariantList,
} from "@ogfcommunity/variants-shared";
import { computed } from "vue";
import VariantDemoView from "./VariantDemoView.vue";
import { toUpperCaseFirstLetter } from "@/utils/format-utils";

const props = defineProps<{ variant: string }>();

const rulesDescription = computed(() => getRulesDescription(props.variant));

const variantExists = computed(() => getVariantList().includes(props.variant));
</script>

<template>
  <main>
    <div v-if="!variantExists">Sorry, variant not found.</div>
    <div v-if="variantExists" class="grid-page-layout">
      <div>
        <h1>{{ toUpperCaseFirstLetter(props.variant) }} Variant Rules</h1>
        <p v-if="!rulesDescription">Under Construction</p>
        <div v-if="rulesDescription" v-html="rulesDescription"></div>
      </div>
      <div>
        <h1>Demo</h1>
        <VariantDemoView :variant="variant" />
      </div>
    </div>
  </main>
</template>

<style scoped>
main {
  font-family: "helvetica", "arial", "sans-serif";
}

.grid-page-layout {
  max-width: none;
  overflow-x: scroll;
  grid-template-columns: minmax(45ch, 90ch) 1fr;
}

:deep(strong, h1, h2) {
  font-weight: bold;
}
</style>
