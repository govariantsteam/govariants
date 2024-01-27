<script setup lang="ts">
import {
  TimeControlType,
  type ITimeControlConfig,
} from "@ogfcommunity/variants-shared/src/time_control";
import { ref, watch } from "vue";

const config: ITimeControlConfig = {
  type: TimeControlType.Absolute,
  mainTimeMS: 300000,
};

const mainTimeS = ref(300);
watch(mainTimeS, (value) => (config.mainTimeMS = value * 1000));

const emit = defineEmits<{
  (e: "configChanged", config: ITimeControlConfig | null): void;
}>();

function emitConfigChange() {
  emit("configChanged", typeRef.value === null ? null : config);
}

const typeRef = ref(null);
watch(typeRef, () => {
  if (typeRef.value !== null) {
    config.type = typeRef.value;
  }
});
</script>

<template>
  <form @change="emitConfigChange" class="config-form-column">
    <h3>Time Control</h3>
    <select v-model="typeRef">
      <option :value="null">Unlimited Time</option>
      <option :value="TimeControlType.Absolute">Absolute</option>
      <!--<option :value="TimeControlType.Fischer">Fischer</option>   -->
    </select>
    <template v-if="typeRef !== null">
      <label>Main Time (s)</label>
      <input type="number" v-model="mainTimeS" />
    </template>
    <!--
        <template v-if="typeRef === TimeControlType.Fischer">
            <label>Increment</label>
            <input type="number" />
        </template>
        -->
  </form>
</template>

<style>
input {
  width: fit-content;
}
select {
  width: fit-content;
}
</style>
