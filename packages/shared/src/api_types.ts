import { MovesType } from "./lib/utils";
import {
  ITimeControlBase,
  ITimeControlConfig,
} from "./time_control/time_control.types";

export interface UserRanking {
  rating: number
  rd: number
  vol: number
}

export interface User {
  username?: string;
  id: string;
  ranking?: UserRanking;
}
export interface GameResponse {
  id: string;
  variant: string;
  moves: MovesType[];
  config: { time_control?: ITimeControlConfig };
  players?: Array<User | undefined>;
  time_control?: ITimeControlBase;
}

export interface UserResponse {
  id?: string;
  login_type: "guest" | "persistent";
  username?: string;
  ranking?: UserRanking;
}

export type GamesFilter = {
  user_id?: string;
  variant?: string;
};

export type GameStateResponse = {
  state: object;
  round: number;
  next_to_play: number[];
  special_moves: { [key: string]: string };
  result: string;
  seat: number | null;
  timeControl?: ITimeControlBase;
};

export type GameInitialResponse = Omit<
  GameResponse,
  "moves" | "timeControl"
> & {
  stateResponse: GameStateResponse;
};
