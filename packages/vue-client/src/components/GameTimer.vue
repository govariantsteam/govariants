<script setup lang="ts">
import { ref, watch, computed } from "vue";
import type { IPerPlayerTimeControlBase } from "@ogfcommunity/variants-shared";
import { isDefined } from "@vueuse/core";

const props = defineProps<{
  time_control: IPerPlayerTimeControlBase;
}>();

const time = ref(props.time_control.remainingTimeMS);
const formattedTime = computed(() => msToTime(time.value));
let timerIndex: number | null = null;

watch(
  props,
  (_value, _oldValue, onCleanup) => {
    resetTimer();
    onCleanup(() => {
      if (timerIndex !== null) {
        clearInterval(timerIndex);
      }
    });
  },
  { immediate: true },
);

function resetTimer(): void {
  if (timerIndex !== null) {
    clearInterval(timerIndex);
  }
  time.value = props.time_control.remainingTimeMS;

  if (isDefined(props.time_control.onThePlaySince) && time.value !== null) {
    let elapsed;
    const onThePlaySince = new Date(props.time_control.onThePlaySince);
    // this is not ideal
    if (
      "stagedMoveAt" in props.time_control &&
      props.time_control.stagedMoveAt !== null
    ) {
      const stagedMove = new Date(props.time_control.stagedMoveAt as Date);
      elapsed = stagedMove.getTime() - onThePlaySince.getTime();
    } else {
      const now = new Date();
      elapsed = now.getTime() - onThePlaySince.getTime();

      timerIndex = window.setInterval(() => {
        if (time.value <= 0 && timerIndex !== null) {
          clearInterval(timerIndex);
        } else {
          const timeStamp = new Date();
          const elapsed = timeStamp.getTime() - onThePlaySince.getTime();
          time.value = props.time_control.remainingTimeMS - elapsed;
        }
      }, 1000);
    }
    time.value = Math.max(0, time.value - elapsed);
  }
}

function msToTime(ms: number): string {
  let msCopy = ms;

  const milliseconds = ms % 1000;
  msCopy = (msCopy - milliseconds) / 1000;

  const seconds = msCopy % 60;
  msCopy = (msCopy - seconds) / 60;

  const minutes = msCopy % 60;
  msCopy = (msCopy - minutes) / 60;

  if (msCopy < 1) {
    return `${minutes.toLocaleString(undefined, {
      minimumIntegerDigits: 2,
    })}:${seconds.toLocaleString(undefined, { minimumIntegerDigits: 2 })}`;
  }

  const hours = msCopy % 24;
  msCopy = (msCopy - hours) / 24;

  if (msCopy < 1) {
    return `${hours.toLocaleString(undefined, {
      style: "unit",
      unit: "hour",
    })}`;
  }

  const days = msCopy;

  return `${days.toLocaleString(undefined, {
    style: "unit",
    unit: "day",
  })}`;
}
</script>

<template>
  <div>
    {{ formattedTime }}
  </div>
</template>
