import { GamePhase } from "./abstract_game";
import { MovesType } from "./lib/utils";
import { ITimeControlBase } from "./time_control/time_control.types";

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
  time_control?: ITimeControlBase;
}

export interface GameStateResponse {
  variant_state: unknown; // output of exportState()
  next_to_play: number[];
  phase: GamePhase;
  result: string;
  round: number;
}

export interface UserResponse {
  id?: string;
  login_type: "guest" | "persistent";
  username?: string;
}

export type GamesFilter = {
  user_id?: string;
  variant?: string;
};
