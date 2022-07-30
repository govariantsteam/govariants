import { BadukView } from "./baduk";
import { GameView } from "./view_types";

// Is there any way we can get away from `any` here?
// I think only the infra needs to touch these functions, but still!
export const view_map: {
  [variant: string]: GameView<any>;
} = {
  baduk: BadukView,
};
