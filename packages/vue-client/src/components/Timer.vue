<script setup lang="ts">
import { isDefined } from "@vueuse/core";
import { ref, watch, watchEffect } from "vue";

const props = defineProps<{
  server_remaining_time_ms: number | null;
  on_the_play_since: Date | string | null;
}>();

const time = ref(props.server_remaining_time_ms ?? 0);
const formattedTime = ref(
  props.server_remaining_time_ms ? msToTime(props.server_remaining_time_ms) : ""
);
const isCountingDown = ref(false);
let timerIndex: number | null = null;

watch(time, (t) => {
  if (t === null) {
    formattedTime.value = "";
  } else {
    formattedTime.value = msToTime(t);
  }
});

// ToDo: after reload or navigating away and back,
// the timer does not count down anymore
// I don't know how to fix it :(
watch(props, (next) => {
  if (timerIndex !== null) {
    clearInterval(timerIndex);
  }
  time.value = props.server_remaining_time_ms ?? 0;

  if (
    isDefined(props.on_the_play_since) &&
    props.server_remaining_time_ms !== null
  ) {
    isCountingDown.value = true;
    const onThePlaySince: Date = new Date(props.on_the_play_since);
    const now = new Date();
    time.value -= now.getDate() - onThePlaySince.getDate();
  } else {
    isCountingDown.value = false;
  }

  if (isDefined(props.on_the_play_since)) {
    timerIndex = setInterval(() => {
      if (time.value <= 0 && timerIndex !== null) {
        clearInterval(timerIndex);
      } else {
        time.value -= 1000;
      }
    }, 1000);
  }
});

watchEffect((onCleanup) => {
  onCleanup(() => {
    if (timerIndex !== null) {
      clearInterval(timerIndex);
    }
  });
});

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
