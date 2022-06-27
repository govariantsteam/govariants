/**
 * @license AGPL-3.0-or-later
 */

/**
 * An abstract class that can represent any game on the server
 */
export abstract class AbstractGame<GameState = object> {
  /** The name of the variant being played */
  abstract variantName(): string;

  /**
   * Play one move by the specified player.
   *
   * May throw if the move was invalid and we should return that information
   * to the user
   */
  abstract playMove(move: string, player: number): boolean;
  /**
   * Returns complete representation of the game as a string.
   *
   * `game.serialize(game.deserialize(str))` should return `str`.
   */
  abstract serialize(): GameState;

  /**
   * Sets the internal state from the string representation.
   *
   * `game.serialize(game.deserialize(str))` should return `str`.
   *
   * May throw if gamestate is invalid.
   */
  abstract deserialize(gamestate: GameState): void;

  /**
   * Returns the list of players that still need to play a move this round.
   *
   * When the empty array is returned, the game is over.
   */
  abstract nextToPlay(): number[];

  /**
   * Process config (this will be called before any moves are played)
   *
   * May throw if config is invalid.
   */
  abstract processConfig(config: object): void;
}
