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
import { computed, reactive, ref, watchEffect } from "vue";
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
const gameResponse: GameResponse = reactive(DEFAULT_GAME);
const game = computed(() => {
  if (!gameResponse.variant) {
    return { result: null, state: null };
  }
  const game_obj = makeGameObject(gameResponse.variant, gameResponse.config);
  gameResponse.moves.forEach((m) => {
    const { player, move } = getOnlyMove(m);
    game_obj.playMove(player, move);
  });
  const result =
    game_obj.phase === "gameover" ? game_obj.result || "Game over" : null;
  const state = game_obj.exportState(playing_as.value);
  return {
    result,
    state,
  };
});
const specialMoves = computed(() =>
  !gameResponse.variant || !gameResponse.config
    ? {}
    : makeGameObject(gameResponse.variant, gameResponse.config).specialMoves()
);
const variantGameView = computed(() => board_map[gameResponse.variant]);
const variantDescriptionShort = computed(
  () => variant_short_description_map[gameResponse.variant] ?? ""
);
watchEffect(async () => {
  // TODO: provide a cleanup function to cancel the request.
  Object.assign(gameResponse, await requests.get(`/games/${props.gameId}`));

  const userSeats = gameResponse.players
    ?.map((playerUser: User | undefined, index: number) =>
      playerUser && playerUser?.id === user.value?.id ? index : null
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
  game: GameResponse
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
  <component
    v-if="variantGameView && game.state"
    v-bind:is="variantGameView"
    v-bind:gamestate="game.state"
    v-bind:config="gameResponse.config"
    v-on:move="makeMove"
  />
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

  <div>
    <button
      v-for="(value, key) in specialMoves"
      :key="key"
      @click="makeMove(key as string)"
    >
      {{ value }}
    </button>
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

@media (min-width: 664px) {
  .board {
    width: 600px;
  }
}
</style>
