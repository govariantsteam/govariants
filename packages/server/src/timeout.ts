import { gamesCollection, getGame, getGamesWithTimeControl } from "./games";
import {
    MovesType,
    getOnlyMove,
    makeGameObject,
  } from "@ogfcommunity/variants-shared";
import { timeControlHandlerMap } from "./time-control";
import { ObjectId } from "mongodb";
import { io } from "./socket_io";

type GameTimeouts = {
    // timeout for this player, or null
    // used to clear the timeout timer
    [player: number]: ReturnType<typeof setTimeout> | null
}

export class TimeoutService {
    private timeoutsByGame = new Map<string, GameTimeouts>();

    constructor() {
    }

    public async initialize(): Promise<void> {
        // I would like to improve this by only querying unfinished games from db
        // but currently I think its not possible, because of the game result
        // is not being stored in the db directly
        for (const game of (await getGamesWithTimeControl())) {
            const game_object = makeGameObject(game.variant, game.config);

            try {
                // check if game is already finished
                game.moves.forEach((moves) => {
                    const { player, move } = getOnlyMove(moves);
                    game_object.playMove(player, move);
                });

                if (game_object.result !== '') {
                    continue
                }

                const timeHandler = new timeControlHandlerMap[game.variant]()
                for (const playerNr of game_object.nextToPlay()) {
                    const t = timeHandler.getMsUntilTimeout(game, playerNr)
                    this.scheduleTimeout(game.id, playerNr, t);
                }
            }
            catch (error) {
                console.error(error);
                continue;
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
        const timeoutResolver = async () => {
            console.log('timeout triggered')
            const game = await getGame(gameId)

            const timeoutMove: MovesType = {[playerNr]: 'timeout'};
            game.moves.push(timeoutMove);
            let timeControl = game.time_control;

            // this next part is somewhat duplicated from the playMove function
            // which I don't like. But for parallel variants and consistency (move timestamps),
            // the timeout move needs to be handled as well.
            const game_object = makeGameObject(game.variant, game.config);
            game.moves.forEach((moves) => {
                const { player, move } = getOnlyMove(moves);
                game_object.playMove(player, move);
            });

            if (game_object.result !== '') {
                this.clearGameTimeouts(game.id);
          
              } else {
                const timeHandler = new timeControlHandlerMap[game.variant]();
                timeControl = timeHandler.handleMove(game, game_object, playerNr, 'timeout');
              }

            // TODO: improving the error handling would be great in future
            await gamesCollection()
            .updateOne({ _id: new ObjectId(gameId) }, { $push: { moves: timeoutMove }, $set: { time_control: timeControl } })
            .catch(console.log);

            io().emit(`game/${gameId}`, game)
        }

        const timeout = setTimeout(timeoutResolver, inTimeMs);
        this.setPlayerTimeout(gameId, playerNr, timeout);
    }
}