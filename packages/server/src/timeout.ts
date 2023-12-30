type GameTimeouts = {
    // timeout for this player, or null
    // used to clear the timer
    [player: number]: ReturnType<typeof setTimeout> | null
}

export class TimeoutService {
    private timeoutsByGame = new Map<string, GameTimeouts>();

    constructor() {
        
    }

    public initialize(): void {

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
        let gameTimeouts = this.timeoutsByGame.get(gameId)

        if (gameTimeouts !== undefined) {
            Object.values(gameTimeouts).filter(t => t !== null).forEach(clearTimeout);
            this.timeoutsByGame.delete(gameId)
        }
    }

    public clearPlayerTimeout(gameId: string, playerNr: number): void {
        this.setPlayerTimeout(gameId, playerNr, null);
    }

    public scheduleTimeout(gameId: string, playerNr: number, inTimeMs: number): void {
        let timeout = setTimeout(() => {
            // TODO
            console.log(`player nr ${playerNr} timed out`)
        }, inTimeMs);

        this.setPlayerTimeout(gameId, playerNr, timeout);
    }
}