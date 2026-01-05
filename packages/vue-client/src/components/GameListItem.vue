<script setup lang="ts">
import {
  uiTransform,
  type GameInitialResponse,
} from "@ogfcommunity/variants-shared";
import { computed } from "vue";
import { getBoard } from "@/board_map";

const props = defineProps<{ game: GameInitialResponse }>();

const transformedGameData = computed(() =>
  uiTransform(props.game.variant, props.game.config, props.game.state),
);

const variantGameView = computed(() => getBoard(props.game.variant));
</script>

<template>
  <li class="game-list-item">
    <RouterLink v-bind:to="{ name: 'game', params: { gameId: props.game.id } }">
      <div class="event-blocker">
        <component
          v-if="variantGameView"
          v-bind:is="variantGameView"
          v-bind:gamestate="transformedGameData.gamestate"
          v-bind:config="transformedGameData.config"
        />
      </div>
      <div class="variant-text">{{ props.game.variant }}</div>
    </RouterLink>
  </li>
</template>

<style scoped>
li.game-list-item {
  padding: 10px;
  width: 50%;
  list-style-type: none;
  display: inline-block;
  .event-blocker {
    pointer-events: none;
  }
}

.variant-text {
  font-variant: small-caps;
  color: gray;
  text-align: right;
  padding: 0;
  margin-top: -15px;
}

a {
  text-decoration: none;
}

.board {
  width: 100%;
  padding: 0;
}
</style>
