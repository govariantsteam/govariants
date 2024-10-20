import { Component } from "vue";

// This map can be used to set which component is displayed in the
// GameView for a given variant. If there is no entry for a variant,
// then we default to the component in board_map.
// This should be used when we want to display more than just the
// board in GameView.
export const playing_table_map: {
  [variant: string]: Component<{ config: unknown; gamestate: unknown }>;
} = {};
