<script lang="ts">
import type { MovesType } from "@ogfcommunity/variants-shared";

type Stone = { colors: string[]; annotation?: "CR" };

function forEachMoveModifyStone(
  moves: MovesType,
  board: Grid<Stone>,
  fn: (stone: Stone, player: number) => void,
) {
  Object.keys(moves).forEach((player_str) => {
    const player = Number(player_str);
    const move_str = moves[player];
    if (move_str.length !== 2) {
      // special moves like "pass" and "resign"
      return;
    }
    const move = Coordinate.fromSgfRepr(move_str);

    const stone = board.at(move);
    if (stone) {
      fn(stone, player);
    }
  });
}
</script>

<script setup lang="ts">
import MulticolorGridBoard from "./MulticolorGridBoard.vue";
import {
  Coordinate,
  type ParallelGoConfig,
  type ParallelGoState,
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

const emit = defineEmits<{
  (e: "move", pos: string): void;
}>();

function positionClicked(pos: Coordinate) {
  emit("move", pos.toSgfRepr());
}

const board = computed(() => {
  const gboard = Grid.from2DArray(props.gamestate.board);
  const gboard_with_ko_stones = gboard.map((players): Stone => {
    if (isKoStone(players)) {
      return { colors: ["gray"] };
    }
    return { colors: players.map((player) => distinct_colors[player]) };
  });
  if (Object.keys(props.gamestate.staged).length) {
    forEachMoveModifyStone(
      props.gamestate.staged,
      gboard_with_ko_stones,
      (stone, player) => {
        stone.colors.push(distinct_colors[player]);
        stone.annotation = "CR";
      },
    );
  } else {
    forEachMoveModifyStone(
      props.gamestate.last_round,
      gboard_with_ko_stones,
      (stone) => {
        stone.annotation = "CR";
      },
    );
  }
  return gboard_with_ko_stones.to2DArray();
});
</script>

<template>
  <MulticolorGridBoard
    :board="board"
    :board_dimensions="props.config"
    @click="positionClicked"
  />
</template>
