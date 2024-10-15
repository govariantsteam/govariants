import { AbstractGame } from "./abstract_game";

export interface Variant<ConfigT extends object = object> {
  /** The class that implements AbstractGame and manages the state of an ongoing game */
  gameClass: new (config: ConfigT) => AbstractGame;
  description: string;
  rulesDescription?: string;
  deprecated?: boolean;
  defaultConfig: () => ConfigT;
  getPlayerColors?: (config: ConfigT, playerNr: number) => string[];
}
