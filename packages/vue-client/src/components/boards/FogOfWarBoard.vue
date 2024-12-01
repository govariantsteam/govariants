<script setup lang="ts">
import MulticolorGridBoard from "./MulticolorGridBoard.vue";
import {
  Color,
  Coordinate,
  indexToMove,
  DefaultBoardConfig,
  MulticolorStone,
  FogOfWarState,
} from "@ogfcommunity/variants-shared";
import { computed } from "vue";

const props = defineProps<{
  config: DefaultBoardConfig;
  gamestate: FogOfWarState;
}>();

const emit = defineEmits<{
  (e: "move", pos: string): void;
}>();

function positionClicked(pos: Coordinate | number) {
  emit("move", indexToMove(pos));
}

const darkFieldColor = "#a88946";
const lightFieldColor = "#dcb35c";
const darkWhiteColor = "#cccccc";

function toStone(color: Color, darken: boolean): MulticolorStone | null {
  switch (color) {
    case Color.EMPTY:
      return null;
    case Color.BLACK:
      return { colors: ["black"] };
    case Color.WHITE:
      return { colors: [darken ? darkWhiteColor : "white"] };
  }
}

const board_position = computed(() =>
  props.gamestate.board.map((row) =>
    row.map((field) => {
      if (field.visibleColor !== null) {
        return toStone(field.visibleColor, false);
      }
      return toStone(field.lastKnownInformation, true);
    }),
  ),
);

const fields_colors = computed(() =>
  props.gamestate.board.map((row) =>
    row.map((field) => (field.visibleColor !== null ? lightFieldColor : null)),
  ),
);

const score_board = computed(() => {
  const colorTransform = (color: Color): string[] => {
    switch (color) {
      case Color.BLACK:
        return ["black"];
      case Color.WHITE:
        return ["white"];
      case Color.EMPTY:
        return [];
    }
  };
  return props.gamestate.score_board?.map((row) => row.map(colorTransform));
});
</script>

<template>
  <MulticolorGridBoard
    v-if="props.config.board.type === 'grid'"
    :board="board_position"
    :board_dimensions="props.config.board"
    :background_color="darkFieldColor"
    :fields_bg_color="fields_colors"
    :score_board="score_board"
    @click="positionClicked"
  />
</template>
