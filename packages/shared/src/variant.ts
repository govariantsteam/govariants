import { AbstractGame } from "./abstract_game";

export interface Variant {
  /** The class that implements AbstractGame and manages the state of an ongoing game */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gameClass: new (config: any) => AbstractGame;
  description: string;
}
