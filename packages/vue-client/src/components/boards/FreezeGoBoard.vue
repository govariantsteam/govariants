<script setup lang="ts">
import MulticolorGridBoard from "./MulticolorGridBoard.vue";
import {
  Coordinate,
  type FreezeGoState,
  Color,
  GridBadukConfig,
  getWidthAndHeight,
} from "@ogfcommunity/variants-shared";
import { Grid } from "@ogfcommunity/variants-shared";
import { computed } from "vue";

const props = defineProps<{
  config: GridBadukConfig;
  gamestate: FreezeGoState;
}>();

const board_dimensions = computed(() => getWidthAndHeight(props.config));

const NORMAL_COLORS = { background: "#dcb35c", black: "black", white: "white" };
const FROZEN_COLORS = {
  background: "#5cdcdc",
  black: "#0f2240",
  white: "#dae4f2",
};

const emit = defineEmits<{
  (e: "move", pos: string): void;
}>();

function positionClicked(pos: Coordinate) {
  emit("move", pos.toSgfRepr());
}

const board = computed(() => {
  return Grid.from2DArray(props.gamestate.board)
    .map((color) => {
      const theme = props.gamestate.frozen ? FROZEN_COLORS : NORMAL_COLORS;
      switch (color) {
        case Color.EMPTY:
          return null;
        case Color.BLACK:
          return { colors: [theme.black] };
        case Color.WHITE:
          return { colors: [theme.white] };
      }
    })
    .to2DArray();
});
</script>

<template>
  <MulticolorGridBoard
    :board="board"
    :board_dimensions="board_dimensions"
    :background_color="
      gamestate.frozen ? FROZEN_COLORS.background : NORMAL_COLORS.background
    "
    @click="positionClicked"
  />
</template>
