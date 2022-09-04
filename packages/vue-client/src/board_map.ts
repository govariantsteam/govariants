import Baduk from "@/components/boards/BadukBoard.vue";
import BadukBoardAbstract from "@/components/boards/BadukBoardAbstract.vue";

export const board_map: {
  // TODO: add types - I have no idea how this works for Vue components.
  // For React analog, see https://github.com/benjaminpjones/govariants/blob/06e2bb81b42c1a4ec4d2bcb85be621112dbc4b90/packages/client/src/view_types.ts
  [variant: string]: any;
} = {
  baduk: Baduk,
  phantom: Baduk,
  badukWithAbstractBoard: BadukBoardAbstract,
};
