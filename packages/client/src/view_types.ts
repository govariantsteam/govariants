import { MovesType } from "@ogfcommunity/variants-shared";

export interface GameViewProps<S> {
  gamestate: S;
  onMove: (move: MovesType) => void;
}

export type GameView<S> = (props: GameViewProps<S>) => JSX.Element;