import { defineStore } from "pinia";
import type { GameResponse } from "../../../shared/dist";
import { makeGameObject } from "../../../shared/dist";
import type { BadukWithAbstractBoardConfig, BadukWithAbstractBoardState } from "@ogfcommunity/variants-shared/src/baduk/badukWithAbstractBoard";
import * as requests from "../requests";
import type { MovesType } from "../../../shared/src/abstract_game";
import { Intersection } from "../../../shared/src/baduk/board/intersection";

// TODO: Store for multiple variants
export const useStore = (gameId: string) =>
    defineStore({
        id: `game${gameId}`, // One store per game
        state: () => ({
            // TODO: Generate initial state from game config and state types
            gameId, // TODO: Should this be some sort of const?
            width: 0,
            height: 0,
            komi: 0,
            board: {},
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
                this.$patch({ ...(gameResponse.config as BadukWithAbstractBoardConfig), ...gameState });
            },

            async playMove(identifier: number) {
                const move: MovesType = {};
                move[this.next_to_play] = identifier.toString();
                console.log(move);
                await requests.post(`/games/${gameId}/move`, move);
                await this.update();
            },
        },
    });

function getStateFromResponse(response: GameResponse): BadukWithAbstractBoardState {
    const game = makeGameObject(response.variant, response.config);
    response.moves.forEach((move) => {
        game.playMove(move);
    });
    return game.exportState();
}
