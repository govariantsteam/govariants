<script setup lang="ts">
import {
  HasTimeControlConfig,
  timeControlMap,
  supportsSGF,
  getDescription,
  uiTransform,
} from "@ogfcommunity/variants-shared";
import * as requests from "../requests";
import SeatComponent from "@/components/GameView/SeatComponent.vue";
import { useCurrentUser } from "../stores/user";
import type {
  User,
  IPerPlayerTimeControlBase,
  IConfigWithTimeControl,
  GameStateResponse,
  ITimeControlBase,
} from "@ogfcommunity/variants-shared";
import { computed, ref, watchEffect, type Ref } from "vue";
import { socket } from "../requests";
import NavButtons from "@/components/GameView/NavButtons.vue";
import PlayersToMove from "@/components/GameView/PlayersToMove.vue";
import DownloadSGF from "@/components/GameView/DownloadSGF.vue";
import { getPlayingTable } from "@/playing_table_map";
import Swal from "sweetalert2";

const props = defineProps<{ gameId: string }>();

const state_map = new Map<string, Omit<GameStateResponse, "timeControl">>();
const game_state = ref<GameStateResponse | undefined>();
const current_round = ref(0);
const variant = ref("");
const config: Ref<object | undefined> = ref();
const transformedGameData = computed(() => {
  if (variant.value && config.value && game_state.value) {
    return uiTransform(variant.value, config.value, game_state.value.state);
  }
  return undefined;
});
const players = ref<User[]>();
// null <-> viewing the latest round
// while viewing history of game, maybe we should prevent player from making a move (accidentally)
const view_round: Ref<number | null> = ref(null);
const variantGameView = computed(() => getPlayingTable(variant.value));
const variantDescriptionShort = computed(() => getDescription(variant.value));
const user = useCurrentUser();
const playing_as = ref<undefined | number>(undefined);
const displayed_round = computed(() => view_round.value ?? current_round.value);
const time_control = ref<ITimeControlBase | null>(null);
// Admins probably don't want to do admin stuff most of the time.  Let's hide
// admin interface behind a toggle.
const adminMode = ref<boolean>(false);
const errorOccured = ref<boolean>(false);
const creator = ref<User | undefined>();

function setNewState(stateResponse: GameStateResponse): void {
  const { timeControl: timeControl, ...state } = stateResponse;
  if (timeControl) {
    time_control.value = timeControl;
  }

  state_map.set(
    encodeSeatAndRound(stateResponse.round, stateResponse.seat),
    state,
  );
  if (current_round.value < stateResponse.round) {
    current_round.value = stateResponse.round;
  }
  if (
    stateResponse.round === displayed_round.value &&
    playing_as.value === (stateResponse.seat ?? undefined)
  ) {
    game_state.value = stateResponse;
  }
}

function encodeSeatAndRound(round: number, seat: number | null): string {
  return `${round};${seat ?? ""}`;
}

async function updateGameState(
  round: number,
  seat: number | null,
): Promise<void> {
  const maybe_state = state_map.get(encodeSeatAndRound(round, seat));
  if (maybe_state) {
    game_state.value = maybe_state;
    return;
  }
  await requests
    .get(`/games/${props.gameId}/state/?seat=${seat ?? ""}&round=${round}`)
    .then(setNewState)
    .catch(alert);
  return;
}

watchEffect(() => {
  updateGameState(
    view_round.value ?? current_round.value,
    playing_as.value ?? null,
  );
});

watchEffect(async () => {
  await requests
    .get(`/games/${props.gameId}/state/initial`)
    .then((result) => {
      variant.value = result.variant;
      config.value = result.config;
      players.value = result.players;
      creator.value = result.creator;
      setNewState(result);

      // Auto-select seat if user occupies exactly one seat
      const userSeats = players.value
        ?.map((player: User | undefined, index: number) =>
          player?.id === user.value?.id ? index : null,
        )
        .filter((index: number | null): index is number => index !== null);
      if (userSeats?.length === 1) {
        setPlayingAs(userSeats[0]);
      }
    })
    .catch((err) => {
      errorOccured.value = true;
      alert(err);
    });
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
    playing_as.value = undefined;
    return;
  }
  if (playing_as.value === seat) {
    playing_as.value = undefined;
    return;
  }
  if (players.value && players.value[seat]?.id === user.value.id) {
    playing_as.value = seat;
  } else {
    playing_as.value = undefined;
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

// subscribe to seat changes
watchEffect((onCleanup) => {
  const seatsMessage = `game/${props.gameId}/seats`;
  socket.on(seatsMessage, (data) => {
    players.value = data;
  });
  onCleanup(() => {
    socket.off(seatsMessage);
  });
});

// subscribe to game updates for specific seat
watchEffect((onCleanup) => {
  if (!props.gameId) {
    return;
  }
  const topic =
    playing_as.value == null
      ? `game/${props.gameId}`
      : `game/${props.gameId}/${playing_as.value}`;
  socket.emit("subscribe", [topic]);

  onCleanup(() => {
    socket.emit("unsubscribe", [topic]);
  });
});

// subscribe to state events
watchEffect((onCleanup) => {
  socket.on("move", (state: GameStateResponse) => {
    setNewState(state);
  });

  onCleanup(() => {
    socket.off("move");
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
async function repairGame(): Promise<void> {
  await Swal.fire({
    title: "Repair game",
    text: "This action may delete moves in order to restore a game state without errors. If the game has time control, this may have unknown consequences.",
    showCancelButton: true,
  }).then((result) => {
    if (result.isConfirmed) {
      return requests
        .post(`/game/${props.gameId}/repair`)
        .catch(alert)
        .then(() => location.reload());
    }
  });
}
</script>

<template>
  <main>
    <div class="grid-page-layout">
      <div>
        <!-- Left column -->
        <component
          v-if="variantGameView && transformedGameData"
          v-bind:is="variantGameView"
          v-bind:gamestate="transformedGameData.gamestate"
          v-bind:config="transformedGameData.config"
          v-bind:displayed_round="displayed_round"
          v-bind:next-to-play="game_state?.next_to_play"
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

          <div v-if="creator">
            <span class="info-label">Created by:</span>
            <span class="info-attribute">{{
              creator.username ?? creator.id
            }}</span>
          </div>
        </div>

        <PlayersToMove :next-to-play="game_state?.next_to_play" />
      </div>

      <div>
        <!-- Right column -->
        <div className="seat-list">
          <div v-for="(player, idx) in players" :key="idx">
            <SeatComponent
              :user_id="user?.id"
              :admin_mode="adminMode"
              :occupant="player"
              :player_n="idx"
              @sit="sit(idx)"
              @leave="leave(idx)"
              @select="setPlayingAs(idx)"
              :selected="playing_as"
              :time_control="
                time_control?.forPlayer[idx] ?? createTimeControlPreview(config)
              "
              :is_players_turn="
                game_state?.next_to_play?.includes(idx) ?? false
              "
              :variant="variant"
              :config="config"
            />
          </div>

          <div>
            <button
              v-for="(value, key) in game_state?.special_moves"
              :key="key"
              @click="makeMove(key as string)"
            >
              {{ value }}
            </button>
          </div>
        </div>

        <DownloadSGF v-if="supportsSGF(variant)" :gameId="gameId" />
        <div
          v-if="game_state?.result"
          style="font-weight: bold; font-size: 24pt"
        >
          Result: {{ game_state?.result }}
        </div>
        <div v-if="user?.role === 'admin'">
          <input type="checkbox" v-model="adminMode" id="admin" />
          <label for="admin">Admin Mode</label>
        </div>
      </div>
      <button
        class="repair-game-btn"
        v-if="errorOccured"
        v-on:click="repairGame"
      >
        repair game
      </button>
    </div>
  </main>
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
  .info-attribute {
    white-space: pre-wrap;
  }
}

.repair-game-btn {
  background-color: var(--color-warn);
  height: 64px;
  font-size: large;
}
</style>
