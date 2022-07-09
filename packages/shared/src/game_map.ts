import { Baduk } from "./baduk";
import { AbstractGame } from "./abstract_game";

// Is there any way we can get away from `any` here?
// I think only the infra needs to touch these functions, but still!
export const view_map = {
  baduk: Baduk,
} as const;

export function makeGameObject(variant: keyof typeof view_map, config: any) {
  return new view_map[variant](config);
}
