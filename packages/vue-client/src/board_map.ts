import Baduk from "@/components/boards/BadukBoard.vue";
import BadukBoardAbstract from "@/components/boards/BadukBoardAbstract.vue";
import ParallelGoBoard from "@/components/boards/ParallelGoBoard.vue";
import ChessBoard from "@/components/boards/ChessBoard.vue";
import FractionalBoard from "@/components/boards/FractionalBoard.vue";
import KeimaBoard from "@/components/boards/KeimaBoard.vue";
import type { Component } from "vue";

export const board_map: {
  [variant: string]: Component<{ config: unknown; gamestate: unknown }>;
} = {
  baduk: Baduk,
  phantom: Baduk,
  badukWithAbstractBoard: BadukBoardAbstract,
  parallel: ParallelGoBoard,
  capture: Baduk,
  chess: ChessBoard,
  tetris: Baduk,
  pyramid: Baduk,
  "thue-morse": Baduk,
  freeze: Baduk,
  fractional: FractionalBoard,
  keima: KeimaBoard,
};
