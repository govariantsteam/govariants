import { getGame, getGamesWithTimeControl, handleMoveAndTime } from "../games";
import {
  MovesType,
  getOnlyMove,
  makeGameObject,
} from "@ogfcommunity/variants-shared";
import { timeControlHandlerMap } from "./time-handler-map";

type GameTimeouts = {
  // timeout for this player, or null
  // used to clear the timeout timer
  [player: number]: ReturnType<typeof setTimeout> | null;
};

export class TimeoutService {
  private timeoutsByGame = new Map<string, GameTimeouts>();

  /**
   * initializes timeout schedules
   */
  public async initialize(): Promise<void> {
    // I would like to improve this by only querying unfinished games from db
    // but currently I think its not possible, because of the game result
    // is not being stored in the db directly
    for (const game of await getGamesWithTimeControl()) {
      const game_object = makeGameObject(game.variant, game.config);

      try {
        // check if game is already finished
        game.moves.forEach((moves) => {
          const { player, move } = getOnlyMove(moves);
          game_object.playMove(player, move);
        });

        if (game_object.result !== "" || game_object.phase == "gameover") {
          continue;
        }

        const timeHandler = new timeControlHandlerMap[game.variant]();
        for (const playerNr of game_object.nextToPlay()) {
          const t = timeHandler.getMsUntilTimeout(game, playerNr);
          this.scheduleTimeout(game.id, playerNr, t);
        }
      } catch (error) {
        console.error(error);
        continue;
      }
    }
  }

  /**
   * Stores a timeout-id or null for this player + game.
   * If an id was previously stored, the corresponding timeout is cleared.
   */
  private setPlayerTimeout(
    gameId: string,
    playerNr: number,
    timeout: ReturnType<typeof setTimeout> | null,
  ): void {
    let gameTimeouts = this.timeoutsByGame.get(gameId);

    if (gameTimeouts === undefined) {
      gameTimeouts = {};
      this.timeoutsByGame.set(gameId, gameTimeouts);
    } else {
      const playerTimeout = gameTimeouts[playerNr];
      if (playerTimeout) {
        clearTimeout(playerTimeout);
      }
    }

    gameTimeouts[playerNr] = timeout;
  }

  /**
   * Clears the timeout-ids of this game.
   */
  public clearGameTimeouts(gameId: string): void {
    const gameTimeouts = this.timeoutsByGame.get(gameId);

    if (gameTimeouts !== undefined) {
      Object.values(gameTimeouts)
        .filter((t) => t !== null)
        .forEach(clearTimeout);
      this.timeoutsByGame.delete(gameId);
    }
  }

  public clearPlayerTimeout(gameId: string, playerNr: number): void {
    this.setPlayerTimeout(gameId, playerNr, null);
  }

  /**
   * Schedules a timeout for this player + game.
   * Timeout is resolved by adding a timeout move
   * and applying the time control handler again.
   */
  public scheduleTimeout(
    gameId: string,
    playerNr: number,
    inTimeMs: number,
  ): void {
    const timeoutResolver = async () => {
      const timeoutMove: MovesType = { [playerNr]: "timeout" };

      const game = await getGame(gameId);

      try {
        await handleMoveAndTime(gameId, timeoutMove, game);
      } catch (error) {
        console.error(error);
      }
    };

    const timeout = setTimeout(timeoutResolver, inTimeMs);
    this.setPlayerTimeout(gameId, playerNr, timeout);
  }
}
