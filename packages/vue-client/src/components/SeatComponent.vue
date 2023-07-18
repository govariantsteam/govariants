<script setup lang="ts">
import type { User } from "@ogfcommunity/variants-shared";
import Timer from "../components/Timer.vue";

defineProps<{
  user_id?: string;
  occupant?: User;
  player_n: number;
  selected?: number;
  server_remaining_time_ms: number | null;
  on_the_play_since: Date | string | null;
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
      v-bind:server_remaining_time_ms="server_remaining_time_ms"
      v-bind:on_the_play_since="on_the_play_since"
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
