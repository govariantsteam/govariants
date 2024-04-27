<script setup lang="ts">
import {
  makeGameObject,
  getOnlyMove,
  getDefaultConfig,
} from "@ogfcommunity/variants-shared";
import SeatComponent from "@/components/SeatComponent.vue";
import { useCurrentUser } from "../stores/user";
import { computed, reactive, ref, type Ref } from "vue";
import { board_map } from "@/board_map";
import { variant_short_description_map } from "../components/variant_descriptions/variant_description.consts";
import type { MovesType } from "@ogfcommunity/variants-shared";

const props = defineProps<{ variant: string }>();

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

const config = ref(getDefaultConfig(props.variant));
const moves = reactive<Array<MovesType>>([]);
const game = ref(getGame(props.variant, config.value, [], null));

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
const variantDescriptionShort = computed(
  () => variant_short_description_map[props.variant] ?? "",
);

const user = useCurrentUser();

const playing_as = ref<undefined | number>(undefined);
const setPlayingAs = (seat: number) => {
  if (playing_as.value === seat) {
    playing_as.value = undefined;
    return;
  }
  playing_as.value = seat;
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

  try {
    game.value = getGame(
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

    <div v-if="game.next_to_play?.length" class="players-to-move-container">
      <div v-if="game.next_to_play?.length === 1" class="info-label">
        Player {{ game.next_to_play[0] }} to move
      </div>
      <div v-else>
        <span class="info-label">Players to move:</span>
        <ul>
          <li v-for="value in game.next_to_play" :key="value">
            Player {{ value }}
          </li>
        </ul>
      </div>
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

.players-to-move-container {
  margin: 5px 0;
}

.players-to-move-container ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
