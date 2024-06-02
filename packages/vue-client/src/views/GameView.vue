<script setup lang="ts">
import {
  HasTimeControlConfig,
  timeControlMap,
} from "@ogfcommunity/variants-shared";
import * as requests from "../requests";
import SeatComponent from "@/components/GameView/SeatComponent.vue";
import { useCurrentUser } from "../stores/user";
import type {
  User,
  IPerPlayerTimeControlBase,
  IConfigWithTimeControl,
  GameStateResponse,
} from "@ogfcommunity/variants-shared";
import { computed, ref, watchEffect, type Ref } from "vue";
import { board_map } from "@/board_map";
import { socket } from "../requests";
import { variant_short_description_map } from "../components/variant_descriptions/variant_description.consts";
import NavButtons from "@/components/GameView/NavButtons.vue";
import PlayersToMove from "@/components/GameView/PlayersToMove.vue";

const props = defineProps<{ gameId: string }>();

const state_map = new Map<string, GameStateResponse>();
const view_state = ref<GameStateResponse | undefined>();
const current_round = ref(0);
let variant = ref("");
let config: object | undefined = undefined;
const players = ref();
// null <-> viewing the latest round
// while viewing history of game, maybe we should prevent player from making a move (accidentally)
const view_round: Ref<number | null> = ref(null);
const variantGameView = computed(() => board_map[variant.value]);
const variantDescriptionShort = computed(
  () => variant_short_description_map[variant.value] ?? "",
);
const user = useCurrentUser();
const playing_as = ref<undefined | number>(undefined);

function setNewState(stateResponse: GameStateResponse): void {
  state_map.set(
    encodeSeatAndRound(stateResponse.round, stateResponse.seat),
    stateResponse,
  );
  if (current_round.value < stateResponse.round) {
    current_round.value = stateResponse.round;
  }
  if (
    (view_round.value === stateResponse.round ||
      (view_round.value === null &&
        stateResponse.round === current_round.value)) &&
    playing_as.value === (stateResponse.seat ?? undefined)
  ) {
    view_state.value = stateResponse;
  }
}

function encodeSeatAndRound(round: number, seat: number | null): string {
  return `${round};${seat ?? ""}`;
}

async function setViewState(round: number, seat: number | null): Promise<void> {
  const maybe_state = state_map.get(encodeSeatAndRound(round, seat));
  if (maybe_state) {
    view_state.value = maybe_state;
    return;
  }
  await requests
    .get(`/games/${props.gameId}/state/?seat=${seat ?? ""}&round=${round}`)
    .then(setNewState)
    .catch(alert);
  return;
}

watchEffect(() => {
  setViewState(
    view_round.value ?? current_round.value,
    playing_as.value ?? null,
  );
});

watchEffect(async () => {
  await requests
    .get(`/games/${props.gameId}/state/initial`)
    .then((result) => {
      variant.value = result.variant;
      config = result.config;
      players.value = result.players;
      setNewState(result.stateResponse);
    })
    .catch(alert);
});

const sit = (seat: number) => {
  requests
    .post(`/games/${props.gameId}/sit/${seat}`, {})
    .then((players_array: User[]) => {
      players.value = players_array;
      playing_as.value = seat;
    });
};

const leave = (seat: number) => {
  requests
    .post(`/games/${props.gameId}/leave/${seat}`, {})
    .then((players_array: User[]) => {
      players.value = players_array;
      if (playing_as.value === seat) {
        playing_as.value = undefined;
      }
    });
};

const setPlayingAs = (seat: number) => {
  if (!user.value) {
    return;
  }
  if (playing_as.value === seat) {
    playing_as.value = undefined;
    socket.emit(
      "unsubscribe",
      players.value.map((player) => `game/${props.gameId}/${player}`),
    );
    return;
  }
  if (players.value && players.value[seat]?.id === user.value.id) {
    playing_as.value = seat;
    socket.emit("subscribe", [`game/${props.gameId}/${seat}`]);
  }
};

function makeMove(move_str: string) {
  const move: { [player: number]: string } = {};

  if (playing_as.value === undefined) {
    alert("No player selected. Click one of your seats to play a move.");
    return;
  }

  if (view_round.value !== null) {
    alert("Can't play moves while viewing previous round.");
    return;
  }

  move[playing_as.value] = move_str;
  requests.post(`/games/${props.gameId}/move`, move).catch(alert);
}

watchEffect((onCleanup) => {
  if (!props.gameId) {
    return;
  }
  const topic = `game/${props.gameId}`;
  socket.emit("subscribe", [topic]);
  socket.on("move", (state: GameStateResponse) =>
    setViewState(state.round, state.seat),
  );

  const seatsMessage = `game/${props.gameId}/seats`;
  socket.on(seatsMessage, (data) => {
    players.value = data;
  });

  onCleanup(() => {
    socket.emit("unsubscribe", [topic]);
    socket.off("move");
    socket.off(seatsMessage);
  });
});

const createTimeControlPreview = (
  config: unknown,
): IPerPlayerTimeControlBase | null => {
  if (HasTimeControlConfig(config)) {
    const time_control_config = (config as IConfigWithTimeControl).time_control;
    const clock = timeControlMap.get(time_control_config.type);
    if (!clock) {
      throw new Error(`Invalid time control: ${time_control_config.type}`);
    }
    return {
      clockState: clock.initialState(config),
      onThePlaySince: null,
    };
  }
  return null;
};
</script>

<template>
  <div>
    <component
      v-if="variantGameView && view_state?.state"
      v-bind:is="variantGameView"
      v-bind:gamestate="view_state.state"
      v-bind:config="config"
      v-on:move="makeMove"
    />
    <NavButtons :gameRound="current_round" v-model="view_round" />

    <div id="variant-info">
      <div>
        <span class="info-label">Variant:</span>
        <span class="info-attribute">
          {{ variant ?? "unknown" }}
        </span>
      </div>

      <div>
        <span class="info-label">Description:</span>
        <span class="info-attribute">{{ variantDescriptionShort }}</span>
      </div>
    </div>
  </div>
  <div className="seat-list">
    <div v-for="(player, idx) in players" :key="idx">
      <SeatComponent
        :user_id="user?.id"
        :occupant="player"
        :player_n="idx"
        @sit="sit(idx)"
        @leave="leave(idx)"
        @select="setPlayingAs(idx)"
        :selected="playing_as"
        :time_control="
          view_state?.timeControl?.forPlayer[idx] ??
          createTimeControlPreview(config)
        "
        :time_config="(config as IConfigWithTimeControl).time_control"
        :is_players_turn="view_state?.next_to_play?.includes(idx) ?? false"
      />
    </div>

    <div>
      <button
        v-for="(value, key) in view_state?.special_moves"
        :key="key"
        @click="makeMove(key as string)"
      >
        {{ value }}
      </button>
    </div>
  </div>

  <PlayersToMove :next-to-play="view_state?.next_to_play" />

  <div v-if="view_state?.result" style="font-weight: bold; font-size: 24pt">
    Result: {{ view_state?.result }}
  </div>
</template>

<style scoped>
.seat-list {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-content: flex-start;
  column-gap: 20px;
}

@media (min-width: 664px) {
  .board {
    width: var(--board-side-length);
    height: var(--board-side-length);
  }
  .seat-list {
    max-height: var(--board-side-length);
  }
}
</style>
