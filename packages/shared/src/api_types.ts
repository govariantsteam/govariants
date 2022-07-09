import { MovesType } from "./abstract_game";

export interface GameResponse {
  id: number;
  variant: string;
  moves: MovesType[];
  config: unknown;
}
