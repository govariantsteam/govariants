import { AbstractGame } from "./abstract_game";
import { DefaultBoardConfig, DefaultBoardState } from "./lib/board_types";

/**
 * Describes a game variant, including its configuration, behavior, and UI representation.
 *
 * Each variant defines how the game logic is handled (`gameClass`), how players interact with it,
 * and how the game is presented in the UI. This interface is used to register and manage different
 * types of games within the platform.
 *
 * @template ConfigT - The shape of the configuration object used to initialize the game.
 * @template StateT - The shape of the state object used to represent ongoing gameplay.
 */
export interface Variant<
  ConfigT extends object = object,
  StateT extends object = object,
> {
  /** The class that implements AbstractGame and manages the state of an ongoing game */
  gameClass: new (config: ConfigT) => AbstractGame;
  /** Short description of the Variant (shown to players in-game) */
  description: string;
  /**
   * Long description of the variant.  Supports markdown syntax.
   * shown at /variants/<variant>/rules
   */
  rulesDescription?: string;
  /**
   * Set this field to true to mark the variant as deprecated. Existing games (ongoing or
   * completed) will remain accessible, but new games cannot be created.
   */
  deprecated?: boolean;
  /** Used to determine the flow of the game.
   *
   * Valid options:
   * - "sequential" – Players take turns one after another.  This is the most common time control.
   * - "parallel" – All players play a move in each round.
   * - "none" – Time control is not supported.
   */
  time_handling: "sequential" | "parallel" | "none";
  /** The initial config displayed in the config form. */
  defaultConfig: () => ConfigT;
  /**
   * Returns the color(s) associated with a player. This helps link player cards to board
   * elements (e.g., stones), and may support features like board hover in the future.
   */
  getPlayerColors?: (config: ConfigT, playerNr: number) => string[];
  /**
   * Used to migrate legacy config data to the current format, ensuring
   * compatibility with older game records.
   */
  sanitizeConfig?: (config: object) => ConfigT;
  /**
   * Many variants use DefaultBoard for UI rendering, but may require data transformation.
   * Implement this to convert game state into a compatible board state.
   */
  uiTransform?: (
    config: ConfigT,
    state: StateT,
  ) => { config: DefaultBoardConfig; gamestate: DefaultBoardState };

  movePreview?: (
    config: ConfigT,
    state: StateT,
    move: string,
    player: number,
  ) => StateT;
}
