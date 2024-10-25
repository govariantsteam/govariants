<script lang="ts">
import { TimeControlType } from "@ogfcommunity/variants-shared/src/time_control";
function shouldShowPeriodTime(type: TimeControlType) {
  return type == TimeControlType.ByoYomi || type === TimeControlType.Canadian;
}
</script>

<script setup lang="ts">
import type {
  IByoYomiConfig,
  ICanadianTimeConfig,
} from "@ogfcommunity/variants-shared";
import {
  type ITimeControlConfig,
  type IFischerConfig,
} from "@ogfcommunity/variants-shared/src/time_control";
import { ref } from "vue";

const typeRef = ref(null);
const mainTimeS = ref(300);
const periodTimeS = ref(30);
const numPeriods = ref(5);
const fischerIncrementS = ref(20);
const fischerMaxS = ref(600);
const fischerCapped = ref(true);

const emit = defineEmits<{
  (e: "configChanged", config: ITimeControlConfig | null): void;
}>();

function emitConfigChange() {
  let emitConfig: ITimeControlConfig | IFischerConfig | null = null;

  if (typeRef.value !== null) {
    switch (typeRef.value) {
      case TimeControlType.Absolute:
      case TimeControlType.Simple: {
        emitConfig = {
          type: typeRef.value,
          mainTimeMS: mainTimeS.value * 1000,
        };
        break;
      }
      case TimeControlType.Fischer: {
        emitConfig = {
          type: TimeControlType.Fischer,
          mainTimeMS: mainTimeS.value * 1000,
          incrementMS: fischerIncrementS.value * 1000,
          maxTimeMS: fischerCapped.value ? fischerMaxS.value * 1000 : null,
        };
        break;
      }
      case TimeControlType.ByoYomi: {
        const byoConfig: IByoYomiConfig = {
          type: TimeControlType.ByoYomi,
          mainTimeMS: mainTimeS.value * 1000,
          numPeriods: numPeriods.value,
          periodTimeMS: periodTimeS.value * 1000,
        };
        emitConfig = byoConfig;
        break;
      }
      case TimeControlType.Canadian: {
        const canadianConfig: ICanadianTimeConfig = {
          type: TimeControlType.Canadian,
          numPeriods: numPeriods.value,
          periodTimeMS: periodTimeS.value * 1000,
          mainTimeMS: mainTimeS.value * 1000,
        };
        emitConfig = canadianConfig;
        break;
      }
    }
  }

  emit("configChanged", emitConfig);
}
</script>

<template>
  <form @change="emitConfigChange" class="config-form-column">
    <h3>Time Control</h3>
    <select v-model="typeRef">
      <option :value="null">Unlimited Time</option>
      <option :value="TimeControlType.Absolute">Absolute</option>
      <option :value="TimeControlType.Fischer">Fischer</option>
      <option :value="TimeControlType.ByoYomi">Byo-Yomi</option>
      <option :value="TimeControlType.Canadian">Canadian Byo-Yomi</option>
      <option :value="TimeControlType.Simple">Simple</option>
    </select>
    <template v-if="typeRef !== null">
      <label>Main Time (s)</label>
      <input type="number" v-model="mainTimeS" />
    </template>
    <template v-if="typeRef === TimeControlType.Fischer">
      <label>Increment</label>
      <input type="number" v-model="fischerIncrementS" />
      <div class="fischerCappedToggle">
        <label for="cappedToggle">Max</label>
        <input id="cappedToggle" type="checkbox" v-model="fischerCapped" />
      </div>
      <input v-if="fischerCapped" type="number" v-model="fischerMaxS" />
    </template>
    <template v-if="typeRef && shouldShowPeriodTime(typeRef)">
      <label>Number of Periods</label>
      <input type="number" v-model="numPeriods" />
      <label>Period time</label>
      <input type="number" v-model="periodTimeS" />
    </template>
  </form>
</template>

<style scoped>
input {
  width: fit-content;
}
select {
  width: fit-content;
}
.fischerCappedToggle {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;

  label {
    cursor: pointer;
  }
  input {
    cursor: pointer;
  }
}
</style>
