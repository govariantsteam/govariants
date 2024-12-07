import { AbstractGame } from "./abstract_game";
import { DefaultBoardConfig, DefaultBoardState } from "./lib/board_types";

export interface Variant<
  ConfigT extends object = object,
  StateT extends object = object,
> {
  /** The class that implements AbstractGame and manages the state of an ongoing game */
  gameClass: new (config: ConfigT) => AbstractGame;
  description: string;
  rulesDescription?: string;
  deprecated?: boolean;
  time_handling: "sequential" | "parallel" | "none";
  defaultConfig: () => ConfigT;
  getPlayerColors?: (config: ConfigT, playerNr: number) => string[];
  sanitizeConfig?: (config: object) => ConfigT;
  /** Most variants can be represented by DefaultBoard, but require
   * some transformation of the data to fit.  Implement this function to
   * transform the data from the variant data to the board data.
   */
  uiTransform?: (
    config: ConfigT,
    state: StateT,
  ) => { config: DefaultBoardConfig; gamestate: DefaultBoardState };
}
