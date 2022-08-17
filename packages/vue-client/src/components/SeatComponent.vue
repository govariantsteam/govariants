<script lang="ts">
interface UserT {
  username?: string;
  id: string;
}
</script>

<script setup lang="ts">
import type { PropType } from "vue";

function takeSeat() {
  // TODO: hit the server with this
}

function leaveSeat() {
  // TODO: hit the server
}

defineProps({
  user_id: { required: true, type: String },
  occupant: Object as PropType<UserT>,
  player_n: { required: true, type: Number },
});
</script>

<template>
  <div class="seat">
    <p class="seat-number">{{ player_n }}</p>
    <div v-if="occupant === undefined">
      <button @click="takeSeat">Take Seat</button>
    </div>
    <div v-else>
      <p>{{ occupant.username ?? "guest" }}</p>
      <button v-if="occupant.id === user_id" @click="leaveSeat">
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
.seat div {
  display: inline-block;
}
.seat-number {
  font-size: x-large;
  display: inline-block;
  margin-right: 10px;
}
</style>
