<script setup lang="ts">
import type { GameResponse } from "@ogfcommunity/variants-shared";
import Baduk from "@/components/boards/BadukBoard.vue";
import * as requests from "../requests";
import SeatComponent from "@/components/SeatComponent.vue";

const props = defineProps({
  gameId: String,
});

const gameResponse = (await requests.get(
  `/games/${props.gameId}`
)) as GameResponse;
const variantGameView = gameResponse.variant === "baduk" ? Baduk : null;

const dummy_players = [
  { username: "benjito", id: "asdf" },
  undefined,
  { username: "not_benjito", id: "asdfg" },
  // guest
  { id: "1234" },
  // current guest
  { id: "asdf" },
];
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
  <div v-for="(player, idx) in dummy_players" :key="idx">
    <SeatComponent user_id="asdf" :occupant="player" :player_n="idx" />
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
