import ParallelGoBoard from "@/components/boards/ParallelGoBoard.vue";
import ChessBoard from "@/components/boards/ChessBoard.vue";
import FractionalBoard from "@/components/boards/FractionalBoard.vue";
import KeimaBoard from "@/components/boards/KeimaBoard.vue";
import type { Component } from "vue";
import QuantumBoard from "@/components/boards/QuantumBoard.vue";
import DefaultBoard from "./components/boards/DefaultBoard.vue";
import FogOfWarBoard from "./components/boards/FogOfWarBoard.vue";

const board_map: {
  [variant: string]: Component<{ config: unknown; gamestate: unknown }>;
} = {
  parallel: ParallelGoBoard,
  chess: ChessBoard,
  fractional: FractionalBoard,
  keima: KeimaBoard,
  quantum: QuantumBoard,
  "fog of war": FogOfWarBoard,
};

export function getBoard(variant: string) {
  return board_map[variant] ?? DefaultBoard;
}
