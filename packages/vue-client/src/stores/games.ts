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
    async fetchGames(count?: number, offset?: number) {
      this.games = await requests.get(
        `/games?count=${count ?? 0}&offset=${offset ?? 0}`
      );
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
