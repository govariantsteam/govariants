import { Baduk } from "./baduk";
import { AbstractGame } from "./abstract_game";
import { TicTacToe } from "./tictactoe";

// Is there any way we can get away from `any` here?
// I think only the infra needs to touch these functions, but still!
export const game_map: { [variant: string]: any } = {
  baduk: Baduk,
  tictactoe: TicTacToe,
};

export function makeGameObject(
  variant: string,
  config: any
): AbstractGame<any, any> {
  try {
    return new game_map[variant](config);
  } catch (e) {
    throw new Error(`Error processing config: ${e}, ${variant}, ${config}`);
  }
}

export function getVariantList(): string[] {
  return Object.keys(game_map);
}