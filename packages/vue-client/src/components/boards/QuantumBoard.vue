<script lang="ts">
import { Color, type CoordinateLike } from "@ogfcommunity/variants-shared";
</script>

<script setup lang="ts">
import MulticolorGridBoard from "./MulticolorGridBoard.vue";
import MulticolorGraphBoard from "./MulticolorGraphBoard.vue";
import {
  Coordinate,
  type QuantumGoState,
  getWidthAndHeight,
  BadukConfig,
  isGridBadukConfig,
} from "@ogfcommunity/variants-shared";
import { Grid } from "@ogfcommunity/variants-shared";
import { computed } from "vue";

const props = defineProps<{
  config: BadukConfig;
  gamestate: QuantumGoState;
}>();

const gridConfig = computed(() =>
  isGridBadukConfig(props.config) ? props.config : undefined,
);

const graphConfig = computed(() =>
  !isGridBadukConfig(props.config) ? props.config : undefined,
);

const board_dimensions = computed(() =>
  gridConfig.value ? getWidthAndHeight(gridConfig.value) : undefined,
);

const emit = defineEmits<{
  (e: "move", move: string): void;
}>();

function emitMove(move: string) {
  emit("move", move);
}

function board_with_quantum_stones(
  board: Color[][],
  quantum_stones: Array<CoordinateLike>,
) {
  interface MulticolorStone {
    colors: string[];
  }
  const ret: Grid<MulticolorStone | null> = Grid.from2DArray(board).map(
    (color) => {
      switch (color) {
        case Color.BLACK:
          return { colors: ["black"] };
        case Color.WHITE:
          return { colors: ["white"] };
        case Color.EMPTY:
          return null;
      }
    },
  );
  quantum_stones.forEach((pos) => {
    ret.at(pos)?.colors.push("green");
  });
  return ret.to2DArray();
}

const board_0 = computed(() => {
  return board_with_quantum_stones(
    props.gamestate.boards[0],
    props.gamestate.quantum_stones.map((pos) => Coordinate.fromSgfRepr(pos)),
  );
});
const board_1 = computed(() => {
  return board_with_quantum_stones(
    props.gamestate.boards[1],
    props.gamestate.quantum_stones.map((pos) => Coordinate.fromSgfRepr(pos)),
  );
});

function graph_board_with_quantum_stones(
  board: Color[],
  quantum_stones: Array<CoordinateLike>,
) {
  const ret_board = board.map((color) => {
    switch (color) {
      case Color.BLACK:
        return { colors: ["black"], annotation: undefined };
      case Color.WHITE:
        return { colors: ["white"], annotation: undefined };
      case Color.EMPTY:
        return null;
    }
  });

  quantum_stones.forEach((stone) => {
    ret_board.at(stone.x)?.colors.push("green");
  });

  return ret_board;
}

const graph_boards = computed(() => {
  const sequence_0 = props.gamestate.boards.at(0)?.at(0) ?? [];
  const sequence_1 = props.gamestate.boards.at(1)?.at(0) ?? [];

  return {
    board_0: graph_board_with_quantum_stones(
      sequence_0,
      props.gamestate.quantum_stones.map((pos) => Coordinate.fromSgfRepr(pos)),
    ),
    board_1: graph_board_with_quantum_stones(
      sequence_1,
      props.gamestate.quantum_stones.map((pos) => Coordinate.fromSgfRepr(pos)),
    ),
  };
});
</script>

<template>
  <template v-if="gridConfig">
    <div style="width: 50%; height: 100%; display: inline-block">
      <MulticolorGridBoard
        :board="board_0"
        :board_dimensions="board_dimensions!"
        @click="emitMove($event.toSgfRepr())"
      />
    </div>
    <div style="width: 50%; height: 100%; display: inline-block">
      <MulticolorGridBoard
        :board="board_1"
        :board_dimensions="board_dimensions!"
        @click="emitMove($event.toSgfRepr())"
      />
    </div>
  </template>

  <template v-if="graphConfig">
    <div style="width: 50%; height: 100%; display: inline-block">
      <MulticolorGraphBoard
        :board="graph_boards.board_0"
        :board_config="graphConfig!.board"
        @click="emitMove($event.toString())"
      />
    </div>
    <div style="width: 50%; height: 100%; display: inline-block">
      <MulticolorGraphBoard
        :board="graph_boards.board_1"
        :board_config="graphConfig!.board"
        @click="emitMove($event.toString())"
      />
    </div>
  </template>
</template>
