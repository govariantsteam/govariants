/**
 * @license AGPL-3.0-or-later
 */

/**
 * An abstract class that can represent any game on the server
 */
export abstract class AbstractGame<GameConfig = object, GameState = object> {
  private phase_: GamePhase = "play";
  private result_: string = "";

  constructor(protected readonly config: GameConfig) {}

  /**
   * Play one move by the specified player.
   *
   * May throw if the move was invalid and we should return that information
   * to the user
   */
  abstract playMove(move: MovesType): void;

  /** Returns complete representation of the game. */
  abstract exportState(): GameState;

  /**
   * Returns the list of players that need to play a move the next round.
   */
  abstract nextToPlay(): number[];

  /**
   * Total number of players required for this game.  The players will be
   * referenced by number (zero-indexed).
   */
  abstract numPlayers(): number;

  get phase(): GamePhase {
    return this.phase_;
  }
  protected set phase(p: GamePhase) {
    this.phase_ = p;
  }

  /** Get result.  Will only be called when phase() is "gameover" */
  get result(): string {
    return this.result_;
  }
  /** Sets the result of the game. */
  protected set result(res: string) {
    this.result_ = res;
  }

  /**
   * Returns a list of moves that don't happen on the board. (e.g. pass, resign)
   * The mapping is from backend name ("pass") to pretty name ("Pass")
   */
  specialMoves(): { [key: string]: string } {
    return {};
  }
}
export interface MovesType {
  [player: number]: string;
}

export type GamePhase = "play" | "gameover";