<script setup lang="ts">
import {
  makeGameObject,
  type GameResponse,
} from "@ogfcommunity/variants-shared";
import * as requests from "../requests";
import SeatComponent from "@/components/SeatComponent.vue";
import { DELETETHIS_getCurrentUser } from "@ogfcommunity/variants-shared";
import type { User } from "@ogfcommunity/variants-shared";
import { computed, reactive, ref, watchEffect } from "vue";
import { board_map } from "@/board_map";

const props = defineProps({
  gameId: String,
});

const DEFAULT_GAME: GameResponse = {
  id: "",
  variant: "",
  moves: [],
  config: {},
};
const gameResponse: GameResponse = reactive(DEFAULT_GAME);
const gamestate = computed(() => {
  const game_obj = makeGameObject(gameResponse.variant, gameResponse.config);
  gameResponse.moves.forEach((move) => {
    game_obj.playMove(move);
  });
  var t = game_obj.exportState(playing_as.value);
  console.log(t);
  return t;
});
const variantGameView = computed(() => board_map[gameResponse.variant]);
watchEffect(async () => {
  // TODO: provide a cleanup function to cancel the request.
  Object.assign(gameResponse, await requests.get(`/games/${props.gameId}`));
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

const playing_as = ref<undefined | number>(undefined);
const setPlayingAs = (seat: number) => {
  if (playing_as.value === seat) {
    playing_as.value = undefined;
    return;
  }
  if (
    gameResponse.players &&
    gameResponse.players[seat]?.id === DELETETHIS_getCurrentUser().id
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
</script>

<template>
  <component
    v-if="variantGameView"
    v-bind:is="variantGameView"
    v-bind:gamestate="gamestate"
    v-bind:config="gameResponse.config"
    v-on:move="makeMove"
  />
  <div className="seat-list">
    <p style="color: gray">
      Note: as a workaround, we only have one user (The One True User)... Proper
      logins will be implemented soon!
    </p>
    <div v-for="(player, idx) in gameResponse.players" :key="idx">
      <SeatComponent
        :user_id="DELETETHIS_getCurrentUser().id"
        :occupant="player"
        :player_n="idx"
        @sit="sit(idx)"
        @leave="leave(idx)"
        @select="setPlayingAs(idx)"
        :selected="playing_as"
      />
    </div>
  </div>

  <pre>
    <span>from /games/{{gameResponse.id}}</span>
    {{JSON.stringify(gameResponse, null, 2)}}
	</pre>
</template>

<style scoped>
pre {
  text-align: left;
}
</style>
