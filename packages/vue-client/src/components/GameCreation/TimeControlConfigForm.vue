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

const emit = defineEmits<{
  (e: "configChanged", config: ITimeControlConfig | null): void;
}>();

function emitConfigChange() {
  emit("configChanged", typeRef.value === null ? null : config);
}

const typeRef = ref(null);
watch(typeRef, (next) => {
  if (typeRef.value !== null) {
    config.type = typeRef.value;
  }
});
</script>

<template>
  <form @change="emitConfigChange" class="config-form-column">
    <label>Time Control</label>
    <select v-model="typeRef">
      <option :value="null">Unlimited Time</option>
      <option :value="TimeControlType.Absolute">Absolute</option>
      <!--<option :value="TimeControlType.Fischer">Fischer</option>   -->
    </select>
    <template v-if="typeRef !== null">
      <label>Main Time</label>
      <input type="number" v-model="config.mainTimeMS" />
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
</style>
