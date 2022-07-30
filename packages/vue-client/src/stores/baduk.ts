import {
  makeGameObject,
  type BadukConfig,
  type BadukState,
  type Color,
  type GameResponse,
  type MovesType,
} from "@ogfcommunity/variants-shared";
import { defineStore } from "pinia";
import * as requests from "../requests";

// TODO: Store for multiple variants
export const useStore = (gameId: number) =>
  defineStore({
    id: `game${gameId}`, // One store per game
    state: () => ({
      // TODO: Generate initial state from game config and state types
      gameId, // TODO: Should this be some sort of const?
      width: 0,
      height: 0,
      komi: 0,
      board: [] as Color[][],
      next_to_play: 0 | 1,
      captures: { 0: 0, 1: 0 },
    }),
    getters: {
      // doubleCount: (state) => state.counter * 2,
    },
    actions: {
      async update(gameResponse?: GameResponse) {
        gameResponse =
          gameResponse ||
          ((await requests.get(`/games/${this.gameId}`)) as GameResponse);

        const gameState = getStateFromResponse(gameResponse);
        this.$patch({ ...(gameResponse.config as BadukConfig), ...gameState });
      },

      async playMove(x: number, y: number) {
        const move: MovesType = {};
        move[this.next_to_play] = coordsToLetters(x, y);
        await requests.post(`/games/${gameId}/move`, move);
        await this.update();
      },
    },
  });

function getStateFromResponse(response: GameResponse): BadukState {
  const game = makeGameObject(response.variant, response.config);
  response.moves.forEach((move) => {
    game.playMove(move);
  });
  return game.exportState();
}

function coordsToLetters(x: number, y: number) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alphabet[x] + alphabet[y];
}
