import type { AbstractGame } from "@ogfcommunity/variants-shared";
import { defineStore } from "pinia";
import * as requests from "../requests";

export type RootState = {
  //games: AbstractGame[];
  games: any[];
};

export const useStore = defineStore({
  id: "games",
  state: () =>
    // ({
    //   games: <AbstractGame[]>[],
    // } as RootState),
    ({
      games: [],
    } as RootState),
  getters: {
    // doubleCount: (state) => state.counter * 2,
  },
  actions: {
    async fetchGames() {
      // TODO
    },

    async createGame(variant: string, config: string): Promise<any> {
      //Promise<AbstractGame> {
      const game = await requests.post("/games", {
        variant,
        config: JSON.parse(config),
      });
      console.log(game);
      this.games.push(game);
      return game;
    },
  },
});
