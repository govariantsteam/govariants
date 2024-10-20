<script setup lang="ts">
import MulticolorGridBoard from "./MulticolorGridBoard.vue";
import {
  Coordinate,
  type FreezeGoState,
  Color,
  getWidthAndHeight,
  NewBadukConfig,
  isGridBadukConfig,
  GridBadukConfig,
} from "@ogfcommunity/variants-shared";
import { Grid } from "@ogfcommunity/variants-shared";
import { computed } from "vue";
import MulticolorGraphBoard from "./MulticolorGraphBoard.vue";

const props = defineProps<{
  config: NewBadukConfig;
  gamestate: FreezeGoState;
}>();

const board_dimensions = computed(() =>
  isGridBadukConfig(props.config)
    ? getWidthAndHeight(props.config as GridBadukConfig)
    : null,
);

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
function graph_board_clicked(index: number) {
  emit("move", index.toString());
}

const grid_board = computed(() => {
  if (!isGridBadukConfig(props.config)) {
    return null;
  }
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

const graph_board = computed(() => {
  if (isGridBadukConfig(props.config)) {
    return null;
  }
  const sequence = props.gamestate.board.at(0) ?? [];

  return sequence.map((color) => {
    switch (color) {
      case Color.BLACK:
        return { colors: ["black"], annotation: undefined };
      case Color.WHITE:
        return { colors: ["white"], annotation: undefined };
      case Color.EMPTY:
        return null;
    }
  });
});
</script>

<template>
  <MulticolorGridBoard
    v-if="isGridBadukConfig(props.config)"
    :board="grid_board!"
    :board_dimensions="board_dimensions!"
    :background_color="
      gamestate.frozen ? FROZEN_COLORS.background : NORMAL_COLORS.background
    "
    @click="positionClicked"
  />
  <MulticolorGraphBoard
    v-if="!isGridBadukConfig(props.config)"
    :board="graph_board!"
    :board_config="$props.config.board"
    @click="graph_board_clicked"
    :background_color="
      gamestate.frozen ? FROZEN_COLORS.background : NORMAL_COLORS.background
    "
  />
</template>
