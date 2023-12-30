import { getGamesWithTimeControl } from "./games";
import {
    makeGameObject,
  } from "@ogfcommunity/variants-shared";
import { timeControlHandlerMap } from "./time-control";

type GameTimeouts = {
    // timeout for this player, or null
    // used to clear the timer
    [player: number]: ReturnType<typeof setTimeout> | null
}

export class TimeoutService {
    private timeoutsByGame = new Map<string, GameTimeouts>();

    constructor() {
    }

    public async initialize(): Promise<void> {
        for (const game of (await getGamesWithTimeControl())) {
            const game_object = makeGameObject(game.variant, game.config);
            if (game_object.result !== '') {
                // game is already finished
                continue
            }

            const timeHandler = new timeControlHandlerMap[game.variant]()
            for (const playerNr of game_object.nextToPlay()) {
                const t = timeHandler.getMsUntilTimeout(game, playerNr)
                this.scheduleTimeout(game.id, playerNr, t);
            }
        }
    }

    private setPlayerTimeout(gameId: string, playerNr: number, timeout: ReturnType<typeof setTimeout> | null): void {
        let gameTimeouts = this.timeoutsByGame.get(gameId);

        if (gameTimeouts === undefined) {
            gameTimeouts = {};
            this.timeoutsByGame.set(gameId, gameTimeouts);
        }
        else {
            const playerTimeout = gameTimeouts[playerNr]
            if (playerTimeout) {
                clearTimeout(playerTimeout)
            }
        }

        gameTimeouts[playerNr] = timeout;
    }

    public clearGameTimeouts(gameId: string): void {
        const gameTimeouts = this.timeoutsByGame.get(gameId)

        if (gameTimeouts !== undefined) {
            Object.values(gameTimeouts).filter(t => t !== null).forEach(clearTimeout);
            this.timeoutsByGame.delete(gameId)
        }
    }

    public clearPlayerTimeout(gameId: string, playerNr: number): void {
        this.setPlayerTimeout(gameId, playerNr, null);
    }

    public scheduleTimeout(gameId: string, playerNr: number, inTimeMs: number): void {
        const timeout = setTimeout(() => {
            // TODO
            console.log(`player nr ${playerNr} timed out in game ${gameId}`)
        }, inTimeMs);

        this.setPlayerTimeout(gameId, playerNr, timeout);
    }
}