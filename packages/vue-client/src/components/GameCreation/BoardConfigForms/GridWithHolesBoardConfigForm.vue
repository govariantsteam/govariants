<script setup lang="ts">
import {
  GridWithHolesBoardConfig,
  assertRectangular2DArrayOf,
} from "@ogfcommunity/variants-shared";
import { ref, watch } from "vue";

const defaultConfig: GridWithHolesBoardConfig = {
  type: "gridWithHoles",
  bitmap: [
    [3, 3, 3, 3, 2],
    [3, 3, 1, 3, 2],
    [3, 2, 0, 3, 2],
    [3, 3, 3, 3, 2],
    [1, 1, 1, 1, 4],
  ],
};

const props = defineProps<{ initialConfig?: GridWithHolesBoardConfig }>();

const config = ref(props.initialConfig ?? defaultConfig);
const bitmapString = ref<string>(JSON.stringify(defaultConfig.bitmap));
const configError = ref<string>();

watch(bitmapString, () => {
  console.log(`bitmapString changed: ${bitmapString.value}`);
  configError.value = undefined;
  try {
    const isBitmapElement = (x: unknown): x is 0 | 1 | 2 | 3 | 4 =>
      [0, 1, 2, 3, 4].some((y) => x == y);
    const array2D = assertRectangular2DArrayOf(
      JSON.parse(bitmapString.value),
      isBitmapElement,
    );

    config.value.bitmap = array2D as (0 | 1 | 2 | 3 | 4)[][];
    emitConfigChange();
  } catch (error) {
    if (typeof error === "string") {
      configError.value = error;
    } else if (error instanceof Error) {
      configError.value = error.message;
    } else {
      console.warn(error);
      configError.value = "An error occured, see console logs";
    }
  }
});

const emit = defineEmits<{
  (e: "configChanged", config: GridWithHolesBoardConfig): void;
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
    <label>
      Bitmap
      <textarea v-model="bitmapString"></textarea>
    </label>
    <div v-if="configError">{{ configError }}</div>
  </form>
</template>
