import { MovesType } from "./abstract_game";

export interface User {
  username?: string;
  id: string;
}
export interface GameResponse {
  id: string;
  variant: string;
  moves: MovesType[];
  config: unknown;
  players?: Array<User | undefined>;
}
