<script setup lang="ts">
import type {
  User,
  IPerPlayerTimeControlBase,
  IConfigWithTimeControl,
} from "@govariants/shared";
import { computed, getCurrentInstance } from "vue";
import GameTimer from "../GameTimer.vue";
import PlayerSymbol from "./PlayerSymbol.vue";

const props = defineProps<{
  userId?: string;
  adminMode?: boolean;
  occupant?: User;
  playerN: number;
  selected?: number;
  timeControl: IPerPlayerTimeControlBase | null;
  isPlayersTurn: boolean;
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
const timeConfig = computed(
  () => (props.config as IConfigWithTimeControl).time_control,
);
const isSelected = computed(() => props.selected === props.playerN);
</script>

<template>
  <div
    class="seat"
    :class="{ selected: isSelected, 'to-move': isPlayersTurn }"
    @click="$emit('select')"
  >
    <p class="seat-number">{{ playerN }}</p>

    <div v-if="occupant == null">
      <div class="timer-and-button">
        <GameTimer
          v-if="timeControl && timeConfig"
          :time-control="timeControl"
          :time-config="timeConfig"
          :is-seat-selected="false"
        />
        <button v-if="userId" @click.stop="$emit('sit')">Take Seat</button>
      </div>
    </div>
    <div v-else>
      <p class="seat-username">
        {{ occupant.username ?? `guest (...${occupant.id.slice(-6)})` }}
      </p>
      <div class="timer-and-button">
        <GameTimer
          v-if="timeControl && timeConfig"
          :time-control="timeControl"
          :time-config="timeConfig"
          :is-seat-selected="isSelected"
        />
        <button
          v-if="hasLeaveCallback && occupant.id === userId"
          @click.stop="$emit('leave')"
        >
          Leave Seat
        </button>
        <button
          v-if="hasLeaveCallback && occupant.id !== userId && adminMode"
          class="btn-danger"
          @click.stop="$emit('leave')"
        >
          Kick
        </button>
      </div>
    </div>
    <PlayerSymbol :variant="variant" :player-nr="playerN" :config="config" />
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

    &.selected {
      border-color: var(--color-warn);
    }
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

.seat.to-move.selected:not(:has(.alert-timer)) {
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
