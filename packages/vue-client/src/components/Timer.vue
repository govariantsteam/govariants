<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
    countsDown: boolean;
    remainingTimeMS: number;
}>();

let t = ref(props.remainingTimeMS);

if (props.countsDown) {
    const timerIndex = setInterval(() => {
        if (t.value <= 0) {
            clearInterval(timerIndex);
        }
        else {
        t.value -= 1000;
        }
    }, 1000)
}

function msToTime(ms: number): string {
  //ToDo: improve, this is kinda horrible
  let msCopy = ms;
  let days = Math.floor((msCopy / (1000 * 60 * 60 * 24)))
  msCopy = msCopy - days * (1000 * 60 * 60 * 24);
  let hours = Math.floor((msCopy / (1000 * 60 * 60)))
  msCopy = msCopy - hours * (1000 * 60 * 60);
  let minutes = Math.floor(msCopy / (1000 * 60));
  msCopy = msCopy - minutes * (1000 * 60);
  let seconds = Math.floor(msCopy / 1000);

  return `${days.toString()}d : ${hours.toString()}h : ${minutes.toString()}m : ${seconds.toString()}s`;
}
</script>

<template>
    {{ msToTime(t) }}
</template>