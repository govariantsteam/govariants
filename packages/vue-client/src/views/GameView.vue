<script setup lang="ts">
import {
  makeGameObject,
  type GameResponse,
  getOnlyMove,
  HasTimeControlConfig,
} from "@ogfcommunity/variants-shared";
import * as requests from "../requests";
import SeatComponent from "@/components/SeatComponent.vue";
import { useCurrentUser } from "../stores/user";
import type {
  User,
  IPerPlayerTimeControlBase,
  IConfigWithTimeControl,
} from "@ogfcommunity/variants-shared";
import { computed, reactive, ref, watchEffect, type Ref } from "vue";
import { board_map } from "@/board_map";
import { socket } from "../requests";
import { variant_short_description_map } from "../components/variant_descriptions/variant_description.consts";

const props = defineProps<{ gameId: string }>();

const DEFAULT_GAME: GameResponse = {
  id: "",
  variant: "",
  moves: [],
  config: {},
};

// null <-> viewing the latest round
// while viewing history of game, maybe we should prevent player from making a move (accidentally)
const view_round: Ref<number | null> = ref(null);
const navigateRounds = (offset: number): void => {
  if (game.value.round === undefined) {
    // game not initialised
    return;
  }

  const after_offset = (view_round.value ?? game.value.round) + offset;
  const round_in_range = Math.min(game.value.round, Math.max(0, after_offset));

  view_round.value =
    round_in_range === game.value.round ? null : round_in_range;
};

const gameResponse: GameResponse = reactive(DEFAULT_GAME);
const game = computed(() => {
  if (!gameResponse.variant) {
    return { result: null, state: null };
  }
  const game_obj = makeGameObject(gameResponse.variant, gameResponse.config);

  let state: unknown = null;
  gameResponse.moves.forEach((m) => {
    if (
      view_round.value !== null &&
      state === null &&
      game_obj.round === view_round.value
    ) {
      state = structuredClone(game_obj.exportState(playing_as.value));
    }

    const { player, move } = getOnlyMove(m);
    game_obj.playMove(player, move);
  });
  const result =
    game_obj.phase === "gameover" ? game_obj.result || "Game over" : null;

  if (state === null) {
    state = game_obj.exportState(playing_as.value);
  }
  return {
    result,
    state,
    round: game_obj.round,
  };
});
const specialMoves = computed(() =>
  !gameResponse.variant || !gameResponse.config
    ? {}
    : makeGameObject(gameResponse.variant, gameResponse.config).specialMoves(),
);
const variantGameView = computed(() => board_map[gameResponse.variant]);
const variantDescriptionShort = computed(
  () => variant_short_description_map[gameResponse.variant] ?? "",
);
watchEffect(async () => {
  // TODO: provide a cleanup function to cancel the request.
  Object.assign(gameResponse, await requests.get(`/games/${props.gameId}`));

  const userSeats = gameResponse.players
    ?.map((playerUser: User | undefined, index: number) =>
      playerUser && playerUser?.id === user.value?.id ? index : null,
    )
    .filter((index: number | null): index is number => index !== null);
  if (userSeats?.length === 1) {
    setPlayingAs(userSeats[0]);
  }
});

const sit = (seat: number) => {
  requests
    .post(`/games/${props.gameId}/sit/${seat}`, {})
    .then((players: User[]) => {
      gameResponse.players = players;
      playing_as.value = seat;
    });
};

const leave = (seat: number) => {
  requests
    .post(`/games/${props.gameId}/leave/${seat}`, {})
    .then((players: User[]) => {
      gameResponse.players = players;
      if (playing_as.value === seat) {
        playing_as.value = undefined;
      }
    });
};

const user = useCurrentUser();

const playing_as = ref<undefined | number>(undefined);
const setPlayingAs = (seat: number) => {
  if (!user.value) {
    return;
  }
  if (playing_as.value === seat) {
    playing_as.value = undefined;
    return;
  }
  if (
    gameResponse.players &&
    gameResponse.players[seat]?.id === user.value.id
  ) {
    playing_as.value = seat;
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
  requests
    .post(`/games/${gameResponse.id}/move`, move)
    .then((res: GameResponse) => {
      Object.assign(gameResponse, res);
    })
    .catch(alert);
}

watchEffect((onCleanup) => {
  if (!props.gameId) {
    return;
  }
  const message = `game/${props.gameId}`;
  socket.on(message, (data) => {
    Object.assign(gameResponse, data);
  });

  onCleanup(() => {
    socket.off(message);
  });
});
const createTimeControlPreview = (
  game: GameResponse,
): IPerPlayerTimeControlBase | null => {
  if (HasTimeControlConfig(game.config)) {
    const config = game.config as IConfigWithTimeControl;
    return {
      remainingTimeMS: config.time_control.mainTimeMS,
      onThePlaySince: null,
    };
  }
  return null;
};
</script>

<template>
  <div>
    <component
      v-if="variantGameView && game.state"
      v-bind:is="variantGameView"
      v-bind:gamestate="game.state"
      v-bind:config="gameResponse.config"
      v-on:move="makeMove"
    />
    <div class="round-nav-buttons">
      <div class="left-container">
        <button @click="() => navigateRounds(-(game.round ?? 0))">
          &lt;&lt;&lt;
        </button>
        <button @click="() => navigateRounds(-10)">&lt;&lt;</button>
        <button @click="() => navigateRounds(-1)">&lt;</button>
      </div>
      <span>
        {{ view_round ?? game.round ?? "" }} / {{ game.round ?? "" }}</span
      >
      <div class="right-container">
        <button @click="() => navigateRounds(1)">></button>
        <button @click="() => navigateRounds(10)">>></button>
        <button @click="() => navigateRounds(game.round ?? 0)">>>></button>
      </div>
    </div>

    <div id="variant-info">
      <div>
        <span class="info-label">Variant:</span>
        <span class="info-attribute">
          {{ gameResponse.variant ?? "unknown" }}
        </span>
      </div>

      <div>
        <span class="info-label">Description:</span>
        <span class="info-attribute">{{ variantDescriptionShort }}</span>
      </div>
    </div>
  </div>
  <div className="seat-list">
    <div v-for="(player, idx) in gameResponse.players" :key="idx">
      <SeatComponent
        :user_id="user?.id"
        :occupant="player"
        :player_n="idx"
        @sit="sit(idx)"
        @leave="leave(idx)"
        @select="setPlayingAs(idx)"
        :selected="playing_as"
        :time_control="
          gameResponse.time_control?.forPlayer[idx] ??
          createTimeControlPreview(gameResponse)
        "
      />
    </div>

    <div>
      <button
        v-for="(value, key) in specialMoves"
        :key="key"
        @click="makeMove(key as string)"
      >
        {{ value }}
      </button>
    </div>
  </div>

  <div v-if="game.result" style="font-weight: bold; font-size: 24pt">
    Result: {{ game.result }}
  </div>
</template>

<style scoped>
.info-label {
  font-weight: bold;
  margin-right: 0.5em;
}

pre {
  text-align: left;
}

.round-nav-buttons {
  height: fit-content;
  display: flex;
  flex-direction: row;
  width: inherit;
  max-width: var(--board-side-length);
  justify-content: space-between;
  .left-container {
    display: flex;
    flex-direction: row;
    gap: 10px;
  }
  .right-container {
    display: flex;
    flex-direction: row;
    gap: 10px;
  }
}

@media (min-width: 664px) {
  .board {
    width: var(--board-side-length);
    height: var(--board-side-length);
  }
}
</style>
