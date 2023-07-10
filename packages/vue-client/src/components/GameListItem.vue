<script setup lang="ts">
import {
  makeGameObject,
  type GameResponse,
  getOnlyMove,
} from "@ogfcommunity/variants-shared";
import { computed } from "vue";
import { board_map } from "@/board_map";

const props = defineProps<{ game: GameResponse }>();

const game = computed(() => {
  const game_obj = makeGameObject(props.game.variant, props.game.config);
  props.game.moves.forEach((m) => {
    const { player, move } = getOnlyMove(m);
    game_obj.playMove(player, move);
  });
  const state = game_obj.exportState();
  return {
    state,
  };
});

const variantGameView = computed(() => board_map[props.game.variant]);
</script>

<template>
  <li class="game-list-item">
    <RouterLink v-bind:to="{ name: 'game', params: { gameId: props.game.id } }">
      <component
        v-if="variantGameView"
        v-bind:is="variantGameView"
        v-bind:gamestate="game.state"
        v-bind:config="props.game.config"
      />
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
}

.variant-text {
  font-variant: small-caps;
  color: gray;
  text-align: right;
  padding: 0;
  margin-top: -15px;
}

.board {
  width: 100%;
  padding: 0;
}
</style>
