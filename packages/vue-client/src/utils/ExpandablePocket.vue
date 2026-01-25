<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faChevronUp, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import { onMounted, ref } from "vue";

library.add(faChevronUp, faChevronDown);

const props = defineProps<{ label: string; initialExpanded?: boolean }>();

const isExpanded = ref(props.initialExpanded ?? false);

const toggleExpansion = () => {
  isExpanded.value = !isExpanded.value;
};

const content = ref();
const height = ref();

// source: https://stackoverflow.com/questions/42591331/animate-height-on-v-if-in-vuejs-using-transition
onMounted(() => {
  height.value = `${
    content.value.children.item(0).getBoundingClientRect().height
  }px`;
});
</script>

<template>
  <div class="expand-panel">
    <button type="button" class="expand-button" @click="toggleExpansion()">
      <text> {{ props.label }} </text>
      <font-awesome-icon v-if="isExpanded" icon="fa-solid fa-chevron-up" />
      <font-awesome-icon v-if="!isExpanded" icon="fa-solid fa-chevron-down" />
    </button>
    <div ref="content" class="expand-content" :class="{ hidden: !isExpanded }">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.expand-panel {
  border-radius: 4px;
  box-shadow: 2px 2px 2px var(--color-shadow);
  border: 1px solid var(--color-border);

  .expand-button {
    padding: 5px;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    cursor: pointer;
    background-color: transparent;
    border-style: none;
    color: var(--color-text);
  }

  .expand-content {
    overflow: hidden;
    transition: height 0.3s ease;

    &.hidden {
      height: 0px;
    }

    &:not(.hidden) {
      height: v-bind(height);
    }
  }
}
</style>
