<script setup lang="ts">
import type {
  User,
  IPerPlayerTimeControlBase,
  ITimeControlConfig,
} from "@shared/index";
import GameTimer from "../components/GameTimer.vue";

defineProps<{
  user_id?: string;
  occupant?: User;
  player_n: number;
  selected?: number;
  time_control: IPerPlayerTimeControlBase | null;
  time_config?: ITimeControlConfig;
  is_players_turn: boolean;
}>();
</script>

<template>
  <div
    class="seat"
    :class="{ selected: selected === player_n, 'to-move': is_players_turn }"
    @click="$emit('select')"
  >
    <p class="seat-number">{{ player_n }}</p>

    <div v-if="occupant == null">
      <div class="timer-and-button">
        <GameTimer
          v-if="time_control && time_config"
          v-bind:time_control="time_control"
          v-bind:time_config="time_config"
        />
        <button v-if="user_id" @click.stop="$emit('sit')">Take Seat</button>
      </div>
    </div>
    <div v-else>
      <p class="seat-username">
        {{ occupant.username ?? `guest (...${occupant.id.slice(-6)})` }}
      </p>
      <div class="timer-and-button">
        <GameTimer
          v-if="time_control && time_config"
          v-bind:time_control="time_control"
          v-bind:time_config="time_config"
        />
        <button v-if="occupant.id === user_id" @click.stop="$emit('leave')">
          Leave Seat
        </button>
      </div>
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
  margin: 5px 2px;
}
.seat.selected {
  border-color: var(--color-selected-seat);
}
.seat div {
  display: inline-block;
}
.seat-number {
  font-size: x-large;
  display: inline-block;
  margin-right: 10px;
}
.seat.to-move {
  box-shadow: 0px 0px var(--to-move-shadow-width) var(--color-shadow);
}

.seat.to-move.selected {
  box-shadow: 0px 0px var(--to-move-shadow-width) var(--color-selected-seat);
}

.seat.to-move .seat-number {
  font-weight: 600;
}

.seat.to-move .seat-username {
  font-weight: bold;
}

.timer-and-button {
  display: inline-block;
  button {
    margin-left: 0.5rem;
  }
}
</style>
