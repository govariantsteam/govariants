import { defineStore } from "pinia";
import * as requests from "@/requests";
import {
  type GameErrorResponse,
  type GameInitialResponse,
  type GamesFilter,
  gamesFilterToUrlParams,
} from "@ogfcommunity/variants-shared";

export type GameListStoreState = {
  games: (GameInitialResponse | GameErrorResponse)[];
  pageSize: number;
  pageNumber: number;
  filter: GamesFilter;
};

export const gameListStore = defineStore("game-list-store", {
  state: (): GameListStoreState => ({
    games: [],
    pageSize: 10,
    pageNumber: 0,
    filter: {},
  }),
  actions: {
    async load() {
      const offset = this.pageSize * this.pageNumber;
      const url = `/games?count=${this.pageSize}&offset=${offset}${gamesFilterToUrlParams(this.filter)}`;
      this.games = await requests.get(url);
    },
    async firstPage() {
      this.pageNumber = 0;
      await this.load();
    },
    async nextPage() {
      this.pageNumber++;
      await this.load();
    },
    async previousPage() {
      this.pageNumber--;
      await this.load();
    },
    async setPageSize(pageSize: number) {
      this.pageSize = pageSize;
      // reset page to avoid weird behavior
      this.pageNumber = 0;
      await this.load();
    },
    async setFilter(filter: GamesFilter) {
      this.filter = filter;
      // reset page to avoid weird behavior
      this.pageNumber = 0;
      await this.load();
    },
  },
});
