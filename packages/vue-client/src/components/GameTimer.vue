<script setup lang="ts">
import { ref, watch } from "vue";
import type { IPerPlayerTimeControlBase } from "@ogfcommunity/variants-shared";
import { isDefined } from "@vueuse/core";

const props = defineProps<{
  time_control: IPerPlayerTimeControlBase | null;
}>();

const time = ref(props.time_control?.remainingTimeMS ?? 0);
const formattedTime = ref(
  isDefined(props.time_control?.remainingTimeMS)
    ? msToTime(props.time_control?.remainingTimeMS)
    : "",
);
const isCountingDown = ref(false);
let timerIndex: number | null = null;
let lastUpdated: Date;

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
  { immediate: true },
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
    // this is not ideal
    if (
      "stagedMoveAt" in props.time_control &&
      props.time_control.stagedMoveAt !== null
    ) {
      isCountingDown.value = false;
      const onThePlaySince = new Date(props.time_control.onThePlaySince);
      const stagedMove = new Date(props.time_control.stagedMoveAt as Date);
      time.value = Math.max(
        0,
        time.value - (stagedMove.getTime() - onThePlaySince.getTime()),
      );
    } else {
      isCountingDown.value = true;
      const onThePlaySince: Date = new Date(props.time_control.onThePlaySince);
      const now = new Date();
      time.value = Math.max(
        0,
        time.value - (now.getTime() - onThePlaySince.getTime()),
      );
    }
  } else {
    isCountingDown.value = false;
  }

  if (isCountingDown.value && typeof window !== "undefined") {
    lastUpdated = new Date();
    timerIndex = window.setInterval(() => {
      if (time.value <= 0 && timerIndex !== null) {
        clearInterval(timerIndex);
      } else {
        const timeStamp = new Date();
        time.value -= timeStamp.getTime() - lastUpdated.getTime();
        lastUpdated = timeStamp;
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
