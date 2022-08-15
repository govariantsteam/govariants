import { MovesType } from "./abstract_game";

export interface GameResponse {
  id: string;
  variant: string;
  moves: MovesType[];
  config: unknown;
}

export interface UserResponse {
  id?: string;
  login_type: "guest" | "persistent";
}