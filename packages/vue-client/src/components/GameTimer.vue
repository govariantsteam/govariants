<script setup lang="ts">
import { ref, watch, computed } from "vue";
import {
  type IPerPlayerTimeControlBase,
  msToTime,
} from "@ogfcommunity/variants-shared";
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
</script>

<template>
  <div>
    {{ formattedTime }}
  </div>
</template>
