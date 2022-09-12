<script setup lang="ts">
import type { PropType } from "vue";
import type { User } from "@ogfcommunity/variants-shared";

defineProps({
  user_id: { required: true, type: String },
  occupant: Object as PropType<User>,
  player_n: { required: true, type: Number },
  selected: Number,
});
</script>

<template>
  <div
    v-bind:class="`seat ${selected === player_n ? 'selected' : ''}`"
    @click="$emit('select')"
  >
    <p class="seat-number">{{ player_n }}</p>
    <div v-if="occupant == null">
      <button @click.stop="$emit('sit')">Take Seat</button>
    </div>
    <div v-else>
      <p>{{ occupant.username ?? "guest" }}</p>
      <button v-if="occupant.id === user_id" @click.stop="$emit('leave')">
        Leave Seat
      </button>
    </div>
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
