/**
 * @license AGPL-3.0-or-later
 */

// This is safe as long as all methods/members of this interface are optional.
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface AbstractGame {
  /**
   * Returns the SGF data for a game
   */
  getSGF?(): string;
}

/**
 * An abstract class that can represent any game on the server
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export abstract class AbstractGame<GameConfig = object, GameState = object> {
  private phase_: GamePhase = "play";
  private result_ = "";
  protected readonly config: GameConfig;
  private _round = 0;

  constructor(config?: GameConfig) {
    this.config = config ?? this.defaultConfig();
  }

  /**
   * Play one move by the specified player.
   *
   * May throw if the move was invalid and we should return that information
   * to the user
   */

  abstract playMove(player: number, move: string): void;

  /** Returns complete representation of the game at this point in time. */
  abstract exportState(player?: number): GameState;

  /**
   * Returns the list of players that need to play a move the next round.
   * Returns empty array when the game is finished.
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

  /** Should be called when the game proceeds to the next round. */
  protected increaseRound(): void {
    this._round += 1;
  }

  /**
   * Returns a list of moves that don't happen on the board. (e.g. pass, resign)
   * The mapping is from backend name ("pass") to pretty name ("Pass")
   */
  specialMoves(): { [key: string]: string } {
    return {};
  }

  /**
   * Returns a valid config for the variant.
   *
   * This is used in the game creation form.
   */
  abstract defaultConfig(): GameConfig;

  /**
   * Returns the current round number. A Round can include multiple moves and
   * represents a decision point in the game.
   */
  public get round(): number {
    return this._round;
  }
}

export type GamePhase = "play" | "gameover";
