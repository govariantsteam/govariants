<script setup lang="ts">
import type { GameResponse } from "@ogfcommunity/variants-shared";
import Baduk from "@/components/boards/BadukBoard.vue";
import * as requests from "../requests";

const props = defineProps({
  gameId: String,
});

const gameResponse = (await requests.get(
  `/games/${props.gameId}`
)) as GameResponse;
const variantGameView = gameResponse.variant === "baduk" ? Baduk : null;
</script>

<template>
  <component
    v-if="variantGameView"
    v-bind:is="variantGameView"
    v-bind:gameResponse="gameResponse"
  />
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
