<script setup lang="ts">
import type { User, IPerPlayerTimeControlBase } from "@ogfcommunity/variants-shared";
import Timer from "../components/Timer.vue";

defineProps<{
  user_id?: string;
  occupant?: User;
  player_n: number;
  selected?: number;
  time_control: IPerPlayerTimeControlBase | null;
}>();
</script>

<template>
  <div
    v-bind:class="`seat ${selected === player_n ? 'selected' : ''}`"
    @click="$emit('select')"
  >
    <p class="seat-number">{{ player_n }}</p>

    <div v-if="occupant == null">
      <button v-if="user_id" @click.stop="$emit('sit')">Take Seat</button>
    </div>
    <div v-else>
      <p>{{ occupant.username ?? `guest (...${occupant.id.slice(-6)})` }}</p>
      <button v-if="occupant.id === user_id" @click.stop="$emit('leave')">
        Leave Seat
      </button>
    </div>
    <Timer
      v-bind:time_control="time_control"
    />
  </div>
</template>

<style>
.seat {
  border-radius: 10px;
  border: 2px solid gray;
  display: inline-block;
  width: 200px;
  padding: 10px;
  margin: 2px;
}
.seat.selected {
  border-color: deepskyblue;
}
.seat div {
  display: inline-block;
}
.seat-number {
  font-size: x-large;
  display: inline-block;
  margin-right: 10px;
}
</style>
