<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faChevronUp, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import { ref } from "vue";

library.add(faChevronUp, faChevronDown);

const props = defineProps<{ label: string; initialExpanded?: boolean }>();

const isExpanded = ref(props.initialExpanded ?? false);

const toggleExpansion = () => {
  isExpanded.value = !isExpanded.value;
};
</script>

<template>
  <div class="expandable-container">
    <text> {{ props.label }} </text>
    <button type="button" @click="toggleExpansion()" class="expand-button">
      <font-awesome-icon v-if="isExpanded" icon="fa-solid fa-chevron-up" />
      <font-awesome-icon v-if="!isExpanded" icon="fa-solid fa-chevron-down" />
    </button>
  </div>
  <slot v-if="isExpanded"></slot>
</template>

<style scoped>
.expandable-container {
  display: flex;
  flex-direction: row;
  gap: 10px;
  .expand-button {
    flex: 0;
  }
}
</style>
