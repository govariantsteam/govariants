<script setup lang="ts">
import type {
  User,
  IPerPlayerTimeControlBase,
  IConfigWithTimeControl,
} from "@ogfcommunity/variants-shared";
import { computed, getCurrentInstance } from "vue";
import GameTimer from "../GameTimer.vue";
import PlayerSymbol from "./PlayerSymbol.vue";
import { useCurrentUser } from "../../stores/user";

const props = defineProps<{
  user_id?: string;
  admin_mode?: boolean;
  occupant?: User;
  player_n: number;
  selected?: number;
  time_control: IPerPlayerTimeControlBase | null;
  is_players_turn: boolean;
  variant: string;
  config: object | undefined;
}>();

defineEmits<{
  (event: "select"): void;
  (event: "sit"): void;
  (event: "leave"): void;
}>();
const hasLeaveCallback = computed(
  // https://stackoverflow.com/a/76208995/5001502
  () => !!getCurrentInstance()?.vnode.props?.onLeave,
);
const time_config = computed(
  () => (props.config as IConfigWithTimeControl).time_control,
);
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
          :user_occupies_seat="false"
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
          :user_occupies_seat="occupant.id === useCurrentUser().value?.id"
        />
        <button
          v-if="hasLeaveCallback && occupant.id === user_id"
          @click.stop="$emit('leave')"
        >
          Leave Seat
        </button>
        <button
          v-if="hasLeaveCallback && occupant.id !== user_id && admin_mode"
          class="btn-danger"
          @click.stop="$emit('leave')"
        >
          Kick
        </button>
      </div>
    </div>
    <PlayerSymbol
      v-bind:variant="variant"
      v-bind:player_nr="player_n"
      v-bind:config="config"
    ></PlayerSymbol>
  </div>
</template>

<style scoped>
.seat {
  border-radius: 10px;
  border: 2px solid gray;
  display: inline-block;
  width: 200px;
  padding: 10px;
  margin: 5px 2px;

  &:has(.alert-timer) {
    background-color: var(--color-warn-transparent);
  }
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

/* stolen from bootstrap */
.btn-danger {
  color: #fff;
  background-color: #d9534f;
  border-color: #d43f3a;
}
</style>
