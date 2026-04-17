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
  timeControl: IPerPlayerTimeControlBase;
  timeConfig: ITimeControlConfig;
  isSeatSelected: boolean;
}>();

const clockController = computed(() => {
  const clockController = timeControlMap.get(props.timeConfig.type);
  if (!clockController) {
    throw new Error(`Invalid time control: ${props.timeConfig.type}`);
  }
  return clockController;
});
const time = ref(props.timeControl.clockState);
const formattedTime = computed(() => {
  if (clockController.value.msUntilTimeout(time.value, props.timeConfig) > 0) {
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
  time.value = props.timeControl.clockState;

  if (isDefined(props.timeControl.onThePlaySince) && time.value !== null) {
    let elapsed;
    const onThePlaySince = new Date(props.timeControl.onThePlaySince);
    // this is not ideal
    if (
      "stagedMoveAt" in props.timeControl &&
      props.timeControl.stagedMoveAt !== null
    ) {
      const stagedMove = new Date(props.timeControl.stagedMoveAt as Date);
      elapsed = stagedMove.getTime() - onThePlaySince.getTime();
    } else {
      interval.restart(() => tick(onThePlaySince), 1000);

      const now = new Date();
      elapsed = now.getTime() - onThePlaySince.getTime();
    }
    time.value = clockController.value.elapse(
      elapsed,
      time.value,
      props.timeConfig,
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
    props.timeControl.clockState,
    props.timeConfig,
  );

  const msUntilTimeout = clockController.value.msUntilTimeout(
    time.value,
    props.timeConfig,
  );
  if (msUntilTimeout <= 0) {
    interval.stop();
  } else {
    const remainingSeconds = Math.floor(msUntilTimeout / 1000);
    isAlertMode.value = remainingSeconds <= alertThresholdSeconds;
    if (props.isSeatSelected && isAlertMode.value) {
      stop_and_speak(remainingSeconds.toString());
    }
  }
}
</script>

<template>
  <!--This class is referenced in SeatComponent-->
  <div :class="{ 'alert-timer': isAlertMode }">
    {{ formattedTime }}
  </div>
</template>
