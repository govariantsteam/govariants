import ParallelGoBoard from "@/components/boards/ParallelGoBoard.vue";
import ChessBoard from "@/components/boards/ChessBoard.vue";
import FractionalBoard from "@/components/boards/FractionalBoard.vue";
import KeimaBoard from "@/components/boards/KeimaBoard.vue";
import type { Component } from "vue";
import QuantumBoard from "@/components/boards/QuantumBoard.vue";
import BadukBoardSelector from "./components/boards/BadukBoardSelector.vue";
import SFractionalBoardSelector from "./components/boards/SFractional/SFractionalBoardSelector.vue";
import DefaultBoard from "./components/boards/DefaultBoard.vue";

const board_map: {
  [variant: string]: Component<{ config: unknown; gamestate: unknown }>;
} = {
  baduk: BadukBoardSelector,
  phantom: BadukBoardSelector,
  parallel: ParallelGoBoard,
  capture: BadukBoardSelector,
  chess: ChessBoard,
  tetris: BadukBoardSelector,
  pyramid: BadukBoardSelector,
  "thue-morse": BadukBoardSelector,
  fractional: FractionalBoard,
  keima: KeimaBoard,
  "one color": BadukBoardSelector,
  drift: BadukBoardSelector,
  quantum: QuantumBoard,
  sfractional: SFractionalBoardSelector,
  // deprecated
  badukWithAbstractBoard: BadukBoardSelector,
};

export function getBoard(variant: string) {
  return board_map[variant] ?? DefaultBoard;
}
