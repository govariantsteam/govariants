import type { GameResponse } from "@ogfcommunity/variants-shared";
import { defineStore } from "pinia";
import * as requests from "../requests";

export type RootState = {
  games: GameResponse[];
};

export const useStore = defineStore({
  id: "games",
  state: () =>
    ({
      games: <GameResponse[]>[],
    } as RootState),
  getters: {
    // doubleCount: (state) => state.counter * 2,
  },
  actions: {
    async fetchGames() {
      this.games = await requests.get(`/games`);
    },

    async createGame(variant: string, config: string): Promise<GameResponse> {
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
