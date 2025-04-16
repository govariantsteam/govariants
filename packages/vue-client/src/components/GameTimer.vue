<script setup lang="ts">
import { ref, watch, computed } from "vue";
import {
  type IPerPlayerTimeControlBase,
  timeControlMap,
  type ITimeControlConfig,
} from "@ogfcommunity/variants-shared";
import { isDefined } from "@vueuse/core";
import { stop_and_speak } from "@/utils/voice-synthesizer";

const props = defineProps<{
  time_control: IPerPlayerTimeControlBase;
  time_config: ITimeControlConfig;
  is_seat_selected: boolean;
}>();

const clockController = computed(() => {
  const clockController = timeControlMap.get(props.time_config.type);
  if (!clockController) {
    throw new Error(`Invalid time control: ${props.time_config.type}`);
  }
  return clockController;
});
const time = ref(props.time_control.clockState);
const formattedTime = computed(() => {
  if (clockController.value.msUntilTimeout(time.value, props.time_config) > 0) {
    return clockController.value.timeString(time.value);
  } else {
    return "";
  }
});
const alertThresholdSeconds = 10;
const isAlertMode = ref(false);
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
  time.value = props.time_control.clockState;

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
        const elapsed = new Date().getTime() - onThePlaySince.getTime();
        time.value = clockController.value.elapse(
          elapsed,
          props.time_control.clockState,
          props.time_config,
        );

        const msUntilTimeout = clockController.value.msUntilTimeout(
          time.value,
          props.time_config,
        );
        if (msUntilTimeout <= 0 && timerIndex !== null) {
          clearInterval(timerIndex);
          isAlertMode.value = false;
        } else {
          const remainingSeconds = Math.floor(msUntilTimeout / 1000);
          isAlertMode.value = remainingSeconds <= alertThresholdSeconds;
          if (props.is_seat_selected && isAlertMode.value) {
            stop_and_speak(remainingSeconds.toString());
          }
        }
      }, 1000);
    }
    time.value = clockController.value.elapse(
      elapsed,
      time.value,
      props.time_config,
    );
  } else {
    // this seat is not on the play
    isAlertMode.value = false;
  }
}
</script>

<template>
  <!--This class is referenced in SeatComponent-->
  <div v-bind:class="{ 'alert-timer': isAlertMode }">
    {{ formattedTime }}
  </div>
</template>
