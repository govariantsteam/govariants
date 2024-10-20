import { Component } from "vue";

export const playing_table_map: {
  [variant: string]: Component<{ config: unknown; gamestate: unknown }>;
} = {};
