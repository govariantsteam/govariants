import { Component } from "vue";
import ThueMorseTable from "./components/PlayingTable/ThueMorseTable.vue";
import SFractionalTable from "./components/PlayingTable/SFractionalTable.vue";
import CubeTable from "./components/PlayingTable/CubeTable.vue";
import { getBoard } from "./board_map";
import PolymorphicPlayingTable from "./components/PlayingTable/PolymorphicPlayingTable.vue";

// This map can be used to set which component is displayed in the
// GameView for a given variant. If there is no entry for a variant,
// then we default to the component in board_map.
// This should be used when we want to display more than just the
// board in GameView.
const playing_table_map: {
  [variant: string]: Component<{ config: unknown; gamestate: unknown }>;
} = {
  "thue-morse": ThueMorseTable,
  sfractional: SFractionalTable,
  cube: CubeTable,
  rengo: PolymorphicPlayingTable,
};

export function getPlayingTable(variant: string) {
  return playing_table_map[variant] ?? getBoard(variant);
}
