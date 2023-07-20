<script setup lang="ts">
import { ref, watch } from "vue";
import type { IPerPlayerTimeControlBase } from "@ogfcommunity/variants-shared";
import { isDefined } from "@vueuse/core";

const props = defineProps<{
  time_control: IPerPlayerTimeControlBase | null;
}>();

const time = ref(props.time_control?.remainingTimeMS ?? 0);
const formattedTime = ref(
  props.time_control?.remainingTimeMS
    ? msToTime(props.time_control?.remainingTimeMS)
    : ""
);
const isCountingDown = ref(false);
let timerIndex: number | null = null;

watch(time, (t: number) => {
  if (t === null) {
    formattedTime.value = "";
  } else {
    formattedTime.value = msToTime(t);
  }
});

watch(
  props,
  (value, oldValue, onCleanup) => {
    resetTimer();
    onCleanup(() => {
      if (timerIndex !== null) {
        clearInterval(timerIndex);
      }
    });
  },
  { immediate: true }
);

function resetTimer(): void {
  if (timerIndex !== null) {
    clearInterval(timerIndex);
  }
  time.value = props.time_control?.remainingTimeMS ?? 0;

  if (
    props.time_control &&
    isDefined(props.time_control.onThePlaySince) &&
    props.time_control.remainingTimeMS !== null
  ) {
    isCountingDown.value = true;
    const onThePlaySince: Date = new Date(props.time_control.onThePlaySince);
    const now = new Date();
    time.value -= now.getTime() - onThePlaySince.getTime();
  } else {
    isCountingDown.value = false;
  }

  if (
    isDefined(props.time_control?.onThePlaySince) &&
    typeof window !== "undefined"
  ) {
    timerIndex = window.setInterval(() => {
      if (time.value <= 0 && timerIndex !== null) {
        clearInterval(timerIndex);
      } else {
        time.value -= 1000;
      }
    }, 1000);
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

  const hours = msCopy % 24;
  msCopy = (msCopy - hours) / 24;

  const days = msCopy;

  return `${days.toString()} days ${hours.toString()} hours ${minutes.toString()} minutes ${seconds.toString()} seconds`;
}
</script>

<template>
  <div>
    {{ formattedTime }}
  </div>
</template>
