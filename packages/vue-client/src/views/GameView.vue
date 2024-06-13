<script setup lang="ts">
import {
  makeGameObject,
  type GameResponse,
  getOnlyMove,
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
} from "@ogfcommunity/variants-shared";
import { computed, reactive, ref, watchEffect, type Ref } from "vue";
import { board_map } from "@/board_map";
import { socket } from "../requests";
import { variant_short_description_map } from "../components/variant_descriptions/variant_description.consts";
import NavButtons from "@/components/GameView/NavButtons.vue";
import PlayersToMove from "@/components/GameView/PlayersToMove.vue";
import DownloadSGF from '@/components/GameView/DownloadSGF.vue';


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
    next_to_play: game_obj.nextToPlay(),
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
  await requests
    .get(`/games/${props.gameId}`)
    .then((result) => Object.assign(gameResponse, result))
    .catch(alert);

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
  const seatsMessage = `game/${props.gameId}/seats`;
  socket.on(seatsMessage, (data) => {
    gameResponse.players = data;
  });

  onCleanup(() => {
    socket.off(message);
    socket.off(seatsMessage);
  });
});
const createTimeControlPreview = (
  game: GameResponse,
): IPerPlayerTimeControlBase | null => {
  if (HasTimeControlConfig(game.config)) {
    const config = (game.config as IConfigWithTimeControl).time_control;
    const clock = timeControlMap.get(config.type);
    if (!clock) {
      throw new Error(`Invalid time control: ${config.type}`);
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

    <!---
    TODO: go board has some unnecessary top padding that should be removed
    -->

    <component
      v-if="variantGameView && game.state"
      v-bind:is="variantGameView"
      v-bind:gamestate="game.state"
      v-bind:config="gameResponse.config"
      v-on:move="makeMove"
    />

    <div v-if="game.result" style="font-weight: bold; font-size: 24pt; margin-bottom: 0pt" >
    Result: {{ game.result }}
    </div>

    <NavButtons :gameRound="game.round" v-model="view_round" />

    <DownloadSGF :gameId="gameId"/>


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
        :time_config="(gameResponse.config as IConfigWithTimeControl).time_control"
        :is_players_turn="game.next_to_play?.includes(idx) ?? false"
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

  <PlayersToMove :next-to-play="game.next_to_play" />

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



