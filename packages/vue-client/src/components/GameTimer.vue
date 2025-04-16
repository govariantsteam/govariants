<script setup lang="ts">
import { ref, watch, computed } from "vue";
import {
  type IPerPlayerTimeControlBase,
  timeControlMap,
  type ITimeControlConfig,
} from "@ogfcommunity/variants-shared";
import { isDefined } from "@vueuse/core";
import { stop_and_speak } from "@/utils/voice-synthesizer";
import { useInterval } from "@/utils/restartable_interval";

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
const interval = useInterval();

watch(props, (_value, _oldValue) => resetTimer(), { immediate: true });

function resetTimer(): void {
  interval.stop();
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
      interval.reStart(() => tick(onThePlaySince), 1000);

      const now = new Date();
      elapsed = now.getTime() - onThePlaySince.getTime();
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

function tick(onThePlaySince: Date): void {
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
  if (msUntilTimeout <= 0) {
    interval.stop();
  } else {
    const remainingSeconds = Math.floor(msUntilTimeout / 1000);
    isAlertMode.value = remainingSeconds <= alertThresholdSeconds;
    if (props.is_seat_selected && isAlertMode.value) {
      stop_and_speak(remainingSeconds.toString());
    }
  }
}
</script>

<template>
  <!--This class is referenced in SeatComponent-->
  <div v-bind:class="{ 'alert-timer': isAlertMode }">
    {{ formattedTime }}
  </div>
</template>
