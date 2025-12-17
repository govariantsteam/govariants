import ParallelGoBoard from "@/components/boards/ParallelGoBoard.vue";
import ChessBoard from "@/components/boards/ChessBoard.vue";
import FractionalBoard from "@/components/boards/FractionalBoard.vue";
import KeimaBoard from "@/components/boards/KeimaBoard.vue";
import CubeBoard from "@/components/boards/CubeBoard.vue";
import type { Component } from "vue";
import QuantumBoard from "@/components/boards/QuantumBoard.vue";
import DefaultBoard from "./components/boards/DefaultBoard.vue";
import PolymorphicBoard from "./components/boards/PolymorphicBoard.vue";

const board_map: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [variant: string]: Component<any>;
} = {
  parallel: ParallelGoBoard,
  chess: ChessBoard,
  fractional: FractionalBoard,
  keima: KeimaBoard,
  cube: CubeBoard,
  quantum: QuantumBoard,
  rengo: PolymorphicBoard,
};

export function getBoard(variant: string) {
  return board_map[variant] ?? DefaultBoard;
}
