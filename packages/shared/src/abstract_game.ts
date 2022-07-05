/**
 * @license AGPL-3.0-or-later
 */

/**
 * An abstract class that can represent any game on the server
 */
export abstract class AbstractGame<
  GameConfig = object,
  GameState = object,
  DeadStones = string
> {
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

  // Scoring

  /** Sets the dead stones on the board */
  setDeadStones(_dead_stones: DeadStones): void {
    // Subclasses may reimplement this function if there is a scoring phase.
  }

  /** Ends the scoring phase and finalizes the result.
   *
   * This should likely be reimplemented if setDeadStones has been reimplemented.
   */
  finalizeScore() {
    this.phase_ = "gameover";
  }

  /** Get result.  Will only be called when phase() is "gameover" */
  get result(): string {
    return this.result_;
  }
  /** Sets the result of the game. */
  protected set result(res: string) {
    this.result_ = res;
  }

  canResign(player_: number): boolean {
    return this.numPlayers() === 2;
  }
  resign(player: number) {
    this.phase_ = "gameover";
    const opponent = 1 - player;
    this.result_ = `Player ${opponent} + R`;
  }
}
export interface MovesType {
  [player: number]: string;
}

export type GamePhase = "play" | "scoring" | "gameover";