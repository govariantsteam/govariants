<script setup lang="ts">
import type { GameResponse } from "@ogfcommunity/variants-shared";
import Baduk from "@/components/boards/BadukBoard.vue";
import * as requests from "../requests";
import SeatComponent from "@/components/SeatComponent.vue";
import { DELETETHIS_getCurrentUser } from "@ogfcommunity/variants-shared";
import type { User } from "@ogfcommunity/variants-shared";
import { reactive } from "vue";

const props = defineProps({
  gameId: String,
});

const gameResponse = reactive(
  (await requests.get(`/games/${props.gameId}`)) as GameResponse
);
const variantGameView = gameResponse.variant === "baduk" ? Baduk : null;

const sit = (seat: number) => {
  requests
    .post(`/games/${props.gameId}/sit/${seat}`, {})
    .then((players: User[]) => {
      gameResponse.players = players;
    });
};

const leave = (seat: number) => {
  requests
    .post(`/games/${props.gameId}/leave/${seat}`, {})
    .then((players: User[]) => {
      gameResponse.players = players;
    });
};
</script>

<template>
  <component
    v-if="variantGameView"
    v-bind:is="variantGameView"
    v-bind:gameResponse="gameResponse"
  />
  <p style="color: red">
    WARNING: These seats don't work yet. Just testing the SeatComponent...
  </p>
  <div v-for="(player, idx) in gameResponse.players" :key="idx">
    <SeatComponent
      :user_id="DELETETHIS_getCurrentUser().id"
      :occupant="player"
      :player_n="idx"
      @sit="sit(idx)"
      @leave="leave(idx)"
    />
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
