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
export abstract class AbstractGame<
  GameConfig extends object = object,
  GameState extends object = object,
> {
  private phase_: GamePhase = "play";
  private result_ = "";
  private _round = 0;

  constructor(protected readonly config: GameConfig) {}

  /**
   * Play one move by the specified player.
   *
   * May throw if the move was invalid and we should return that information
   * to the user
   */

  abstract playMove(player: number, move: string): void;

  /** Returns the game state from the perspective of a specific player or observer.
   *
   * @param context.player the 0-indexed seat number of a player, or undefined for observers.
   * @param context.phase the phase of the overall game. Hidden-info variants can
   *   use this to reveal the full state when `"gameover"` — including during
   *   history review of a completed game, where the replayed game object's own
   *   phase is still `"play"` at the viewed round.
   *
   * When omitted, hidden-info variants default to an observer-during-play view
   * (no leakage).
   */
  abstract exportState(context?: ExportContext): GameState;

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
   * Returns the current round number. A Round can include multiple moves and
   * represents a decision point in the game.
   */
  public get round(): number {
    return this._round;
  }
}

export type GamePhase = "play" | "gameover";

/**
 * Context passed to `exportState` so variants can tailor the view.
 *
 * `phase` is the phase of the overall game. When a completed game is being
 * reviewed at a historical round, the replayed game object's `this.phase` is
 * still `"play"` at that round — pass `phase: "gameover"` here to let
 * hidden-info variants reveal the full state. Omitted phase is treated as
 * `"play"` (observer-during-play view — no leakage).
 */
export type ExportContext = {
  player?: number;
  phase?: GamePhase;
};

/**
 * Shared rule for hidden-info variants deciding whether to reveal the full
 * state:
 * - an observer viewing a completed game always sees everything
 * - a seated player sees everything only when viewing the final state (the
 *   replayed game object has itself reached `"gameover"`)
 * - otherwise the caller should return the per-player filtered view
 *
 * @param currentPhase the phase of the replayed game object (`this.phase`),
 *   which differs from `context.phase` during history review
 */
export function shouldRevealHiddenInfo(
  currentPhase: GamePhase,
  context: ExportContext | undefined,
): boolean {
  const gameIsOver = context?.phase === "gameover";
  const atFinalState = currentPhase === "gameover";
  const isObserver = context?.player === undefined;
  return gameIsOver && (isObserver || atFinalState);
}
