import { MovesType } from "@ogfcommunity/variants-shared";

export interface GameViewProps<T> {
  gamestate: T;
  onMove: (move: MovesType) => void;
}
