<script setup lang="ts">
import { TimeControlType } from "@ogfcommunity/variants-shared";
import type { BadukConfig } from "@ogfcommunity/variants-shared";
import { ref, watch, type Ref } from "vue-demi";

const props = defineProps<{ initialConfig: BadukConfig }>();
const config = { ...props.initialConfig } as BadukConfig;

const emit = defineEmits<{
  (e: "configChanged", config: BadukConfig): void;
}>();
const timeControlTypeRef: Ref<TimeControlType | null> = ref(null);
const mainTimeRef: Ref<number> = ref(1000);
watch(timeControlTypeRef, (next: TimeControlType | null) => {
  if (next === null) {
    config.time_control = null;
  }
  else
  {
    config.time_control = {
      type: timeControlTypeRef.value,
      mainTimeMS: mainTimeRef.value
    }
  }
  emitConfigChange();
})
watch(mainTimeRef, (mainTime: number) => {
  config.time_control = {
    type: timeControlTypeRef.value,
    mainTimeMS: mainTime
  }
  emitConfigChange();
})

function emitConfigChange() {
  console.log(config);
  emit("configChanged", config);
}
</script>

<template>
  <form @change="emitConfigChange" class="config-form-column">
    <label>Width</label>
    <input type="number" min="1" v-model="config.width" />
    <label>Height</label>
    <input type="number" min="1" v-model="config.height" />
    <label>Komi</label>
    <input type="number" step="0.5" v-model="config.komi" />
    <label>Time Control</label>
    <select v-model="timeControlTypeRef" >
      <option :value="null">Unlimited Time</option>
      <option :value="TimeControlType.Absolute">Absolute</option>
    </select>
    <label>Main Time</label>
    <input type="number" v-if="timeControlTypeRef !== null" v-model="mainTimeRef"/>
  </form>
</template>

<style>
input {
  width: fit-content;
}
</style>
