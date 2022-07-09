import { MovesType } from "@ogfcommunity/variants-shared";

export interface GameViewProps<C, S> {
  gamestate: S;
  config: C;
  onMove: (move: MovesType) => void;
}
