<script setup lang="ts">
import {
  makeGameObject,
  getOnlyMove,
  getDefaultConfig,
  getDescription,
} from "@ogfcommunity/variants-shared";
import SeatComponent from "@/components/GameView/SeatComponent.vue";
import { useCurrentUser } from "../stores/user";
import { computed, reactive, ref, type Ref } from "vue";
import { board_map } from "@/board_map";
import type { MovesType } from "@ogfcommunity/variants-shared";
import NavButtons from "@/components/GameView/NavButtons.vue";
import PlayersToMove from "@/components/GameView/PlayersToMove.vue";
import { config_form_map } from "@/config_form_map";

const props = defineProps<{ variant: string }>();

// null <-> viewing the latest round
// while viewing history of game, maybe we should prevent player from making a move (accidentally)
const view_round: Ref<number | null> = ref(null);

const config = ref(getDefaultConfig(props.variant));
const variantConfigForm = computed(() => config_form_map[props.variant]);
const moves = reactive<Array<MovesType>>([]);
const playing_as = ref<undefined | number>(undefined);
const setPlayingAs = (seat: number) => {
  if (playing_as.value === seat) {
    playing_as.value = undefined;
    return;
  }
  playing_as.value = seat;
};
const game = computed(() =>
  getGame(
    props.variant,
    config.value,
    moves,
    view_round.value,
    playing_as.value,
  ),
);

function getGame(
  variant: string,
  config: unknown,
  moves: Array<MovesType>,
  viewRound: number | null,
  playingAs?: number,
) {
  const game_obj = makeGameObject(variant, config);

  let state: unknown = null;
  for (let i = 0; i < moves.length; i++) {
    if (viewRound !== null && state === null && game_obj.round === viewRound) {
      state = structuredClone(game_obj.exportState(playingAs));
    }

    const { player, move } = getOnlyMove(moves[i]);
    game_obj.playMove(player, move);
  }
  const result =
    game_obj.phase === "gameover" ? game_obj.result || "Game over" : null;

  if (state === null) {
    state = game_obj.exportState(playingAs);
  }
  return {
    result,
    state,
    round: game_obj.round,
    next_to_play: game_obj.nextToPlay(),
    numPlayers: game_obj.numPlayers(),
  };
}

const specialMoves = computed(() =>
  !props.variant || !config.value
    ? {}
    : makeGameObject(props.variant, config.value).specialMoves(),
);
const variantGameView = computed(() => board_map[props.variant]);
const variantDescriptionShort = computed(() => getDescription(props.variant));

const user = useCurrentUser();

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

  try {
    // Validate the move before pushing onto stack
    getGame(
      props.variant,
      config.value,
      moves.concat([move]),
      view_round.value,
      playing_as.value,
    );
    moves.push(move);
  } catch (e) {
    if (e instanceof Error) {
      alert(e.message);
    }
  }
}

function onConfigChange(c: object) {
  config.value = { ...c };
  // Changing the config most likely invalidates the moves
  // so we restart the game
  moves.length = 0;
}
</script>

<template>
  <div>
    <component
      v-if="variantGameView && game.state"
      v-bind:is="variantGameView"
      v-bind:gamestate="game.state"
      v-bind:config="config"
      v-on:move="makeMove"
    />
    <NavButtons v-model="view_round" :gameRound="game.round" />

    <div id="variant-info">
      <div>
        <span class="info-label">Variant:</span>
        <span class="info-attribute">
          {{ props.variant ?? "unknown" }}
        </span>
      </div>

      <div>
        <span class="info-label">Description:</span>
        <span class="info-attribute">{{ variantDescriptionShort }}</span>
      </div>
    </div>
  </div>
  <div className="seat-list">
    <div v-for="(_, idx) in game.numPlayers" :key="idx">
      <SeatComponent
        :user_id="user?.id"
        :occupant="user || undefined"
        :player_n="idx"
        @select="setPlayingAs(idx)"
        :selected="playing_as"
        :time_control="null"
        :is_players_turn="game.next_to_play?.includes(idx) ?? false"
        :variant="variant"
        :config="config"
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

    <PlayersToMove :next-to-play="game.next_to_play" />

    <component
      v-bind:is="variantConfigForm"
      v-bind:initialConfig="getDefaultConfig(variant)"
      v-on:configChanged="onConfigChange"
    />
  </div>

  <div v-if="game.result" style="font-weight: bold; font-size: 24pt">
    Result: {{ game.result }}
  </div>
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
