<script setup lang="ts">
import { SierpinskyBoardConfig } from "@ogfcommunity/variants-shared";
import { ref } from "vue";

const defaultConfig: SierpinskyBoardConfig = {
  type: "sierpinsky",
  size: 3,
};

const props = defineProps<{ initialConfig?: SierpinskyBoardConfig }>();

const config = ref(props.initialConfig ?? defaultConfig);

const emit = defineEmits<{
  (e: "configChanged", config: SierpinskyBoardConfig): void;
}>();

function emitConfigChange() {
  emit("configChanged", config.value);
}

if (!props.initialConfig) {
  emitConfigChange();
}
</script>

<template>
  <form @change="emitConfigChange" class="config-form-column">
    <label>Size</label>
    <input type="number" min="1" max="6" v-model="config.size" />
  </form>
</template>
