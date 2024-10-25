<script setup lang="ts">
import {
  BoardPattern,
  type BadukWithAbstractBoardConfig,
} from "@ogfcommunity/variants-shared/src/variants/badukWithAbstractBoard";
import { type Ref, ref, watch } from "vue";

const props = defineProps<{ initialConfig: BadukWithAbstractBoardConfig }>();
const patternRef: Ref<BoardPattern> = ref(props.initialConfig.pattern);
const sizeRef: Ref<number> = ref(props.initialConfig.width);
const widthRef: Ref<number> = ref(props.initialConfig.width);
const heightRef: Ref<number> = ref(props.initialConfig.height);
const komiRef: Ref<number> = ref(props.initialConfig.komi);

const emit = defineEmits<{
  (e: "configChanged", config: BadukWithAbstractBoardConfig): void;
}>();

function emitConfigChange() {
  const config = {
    komi: komiRef.value,
    pattern: patternRef.value,
    width:
      patternRef.value === BoardPattern.Rectangular ||
      patternRef.value === BoardPattern.Circular
        ? widthRef.value
        : sizeRef.value,
    height:
      patternRef.value === BoardPattern.Rectangular ||
      patternRef.value === BoardPattern.Circular
        ? heightRef.value
        : sizeRef.value,
  } as BadukWithAbstractBoardConfig;

  emit("configChanged", config);
}

watch(patternRef, emitConfigChange);
watch(sizeRef, emitConfigChange);
watch(widthRef, emitConfigChange);
watch(heightRef, emitConfigChange);
watch(patternRef, () => {
  // defaults for circular board need to be larger
  if (patternRef.value === BoardPattern.Circular) {
    widthRef.value = 9;
    heightRef.value = 9;
  }
});
</script>

<template>
  <div class="config-form-column">
    <label>Pattern</label>
    <select v-model="patternRef" style="width: fit-content">
      <option :value="BoardPattern.Rectangular">Rectangular</option>
      <option :value="BoardPattern.Polygonal">Polygonal</option>
      <option :value="BoardPattern.Circular">Circular</option>
      <option :value="BoardPattern.Trihexagonal">Trihexagonal</option>
      <option :value="BoardPattern.Sierpinsky">Sierpinsky Triangle</option>
    </select>
    <template v-if="patternRef === BoardPattern.Rectangular">
      <label>Width</label>
      <input type="number" min="1" v-model="widthRef" />
      <label>Height</label>
      <input type="number" min="1" v-model="heightRef" />
    </template>
    <template
      v-if="
        patternRef === BoardPattern.Polygonal ||
        patternRef === BoardPattern.Trihexagonal
      "
    >
      <label>Size</label>
      <input type="number" min="1" v-model="sizeRef" />
    </template>
    <template v-if="patternRef === BoardPattern.Sierpinsky">
      <label>Size</label>
      <input type="number" min="1" max="6" v-model="sizeRef" />
    </template>
    <template v-if="patternRef === BoardPattern.Circular">
      <label>Nodes per Ring</label>
      <input type="number" min="3" v-model="widthRef" />
      <label>Number of Rings</label>
      <input type="number" min="3" v-model="heightRef" />
    </template>
    <label>Komi</label>
    <input type="number" step="0.5" v-model="komiRef" />
  </div>
</template>

<style scoped>
input {
  width: fit-content;
}
</style>
