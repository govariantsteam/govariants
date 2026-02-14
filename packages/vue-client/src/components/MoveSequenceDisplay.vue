<script setup lang="ts">
import { computed } from "vue";
import TaegeukStone from "./TaegeukStone.vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";

library.add(faArrowRight);

const props = defineProps<{
  getColors: (n: number) => string[];
  round: number;
  length: number;
}>();

const colors_range = computed(() => {
  const result = [];
  for (let i = 0; i < props.length; i++) {
    result.push(props.getColors(props.round + i));
  }
  return result;
});
</script>
<template>
  <div class="moveSequenceDisplay">
    <font-awesome-icon icon="fa-solid fa-arrow-right" />
    <svg
      v-for="(colors, index) of colors_range"
      :key="index"
      :viewBox="`0 0 2 2`"
      class="stone_preview"
    >
      <TaegeukStone v-if="colors" :colors="colors" :r="1" :cx="1" :cy="1" />
    </svg>
  </div>
</template>

<style scoped>
.moveSequenceDisplay {
  display: flex;
  flex-direction: row;
  gap: 5px;
  align-items: center;
  flex-wrap: wrap;
}
.stone_preview {
  margin: 10px;
  width: 40px;
  height: 40px;
  filter: drop-shadow(3px 5px 6px rgb(0 0 0 / 0.4))
    drop-shadow(-3px -5px 6px rgb(255 255 255 / 0.4));
}
</style>
