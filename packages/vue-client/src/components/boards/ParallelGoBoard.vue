<script lang="ts">
function decodeMove(move: string) {
  return { x: decodeChar(move[0]), y: decodeChar(move[1]) };
}

// a: 0, b: 1, ... z: 25, A: 26, ... Z: 51
function decodeChar(char: string): number {
  const a = "a".charCodeAt(0);
  const z = "z".charCodeAt(0);
  const A = "A".charCodeAt(0);
  const Z = "Z".charCodeAt(0);
  const char_code = char.charCodeAt(0);
  if (char_code >= a && char_code <= z) {
    return char_code - a;
  }
  if (char_code >= A && char_code <= Z) {
    return char_code - A + 26;
  }

  throw `Invalid character in move: ${char} (${char_code})`;
}
</script>

<script setup lang="ts">
import MulticolorGridBoard from "./MulticolorGridBoard.vue";
import type {
  ParallelGoConfig,
  ParallelGoState,
} from "@ogfcommunity/variants-shared";
import { Grid } from "@ogfcommunity/variants-shared";
import { computed } from "vue";

const props = defineProps<{
  config: ParallelGoConfig;
  gamestate: ParallelGoState;
}>();

function isKoStone(colors: number[]) {
  return colors.length === 1 && colors[0] === -1;
}

// https://sashamaps.net/docs/resources/20-colors/
const distinct_colors =
  props.config.num_players === 2
    ? ["black", "white"]
    : [
        "#e6194B",
        "#3cb44b",
        "#ffe119",
        "#4363d8",
        "#f58231",
        "#911eb4",
        "#42d4f4",
        "#f032e6",
        "#bfef45",
        "#fabed4",
        "#469990",
        "#dcbeff",
        "#9A6324",
        "#fffac8",
        "#800000",
        "#aaffc3",
        "#808000",
        "#ffd8b1",
        "#000075",
        "#a9a9a9",
        "#ffffff",
        "#000000",
      ];

function coordsToLetters(x: number, y: number) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alphabet[x] + alphabet[y];
}

const emit = defineEmits<{
  (e: "move", pos: string): void;
}>();

function positionClicked(x: number, y: number) {
  emit("move", coordsToLetters(x, y));
}

const board = computed(() => {
  const gboard = Grid.from2DArray(props.gamestate.board);
  const gboard_with_empty = gboard
    .map((players): { colors: string[]; annotation?: "CR" } | null => {
      if (isKoStone(players)) {
        return { colors: ["gray"] };
      }
      if (players.length === 0) {
        return null;
      }
      return { colors: players.map((player) => distinct_colors[player]) };
    })
    .to2DArray();
  // TODO: set target to ES2017 and use Object.entries
  Object.keys(props.gamestate.staged).forEach((player_str) => {
    const player = Number(player_str);
    if (!props.gamestate.staged[player]) {
      console.log(props.gamestate.staged, player);
    }
    const move = decodeMove(props.gamestate.staged[player]);
    const stone = gboard_with_empty[move.y][move.x];
    if (!stone) {
      gboard_with_empty[move.y][move.x] = {
        colors: [distinct_colors[player]],
        annotation: "CR",
      };
    } else {
      stone.colors.push(distinct_colors[player]);
      stone.annotation = "CR";
    }
  });
  return gboard_with_empty;
});
</script>

<template>
  <MulticolorGridBoard
    :board="board"
    :config="props.config"
    @click="({ x, y }) => positionClicked(x, y)"
  />
</template>
