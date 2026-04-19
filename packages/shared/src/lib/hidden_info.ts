import { ExportContext, GamePhase } from "../abstract_game";

/**
 * Shared rule for hidden-info variants (phantom, lighthouse, one_color, …)
 * deciding whether to reveal the full state to the caller:
 *
 * - an observer viewing a completed game always sees everything
 * - a seated player sees everything only when viewing the final state — the
 *   replayed game object has itself reached `"gameover"`
 * - otherwise the caller should return the per-player filtered view
 *
 * @param currentPhase the phase of the replayed game object (`this.phase`),
 *   which differs from `context.phase` during history review
 */
export function shouldRevealHiddenInfo(
  currentPhase: GamePhase,
  context: ExportContext,
): boolean {
  const gameIsOver = context.phase === "gameover";
  const atFinalState = currentPhase === "gameover";
  const isObserver = context.player === undefined;
  return gameIsOver && (isObserver || atFinalState);
}
