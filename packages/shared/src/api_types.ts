import { MovesType } from "./lib/utils";
import {
  GameNotification,
  GameSubscriptions,
  NotificationType,
} from "./notifications.types";
import {
  ITimeControlBase,
  ITimeControlConfig,
} from "./time_control/time_control.types";

export interface UserRankings {
  [variant: string]: UserRanking;
}

export interface UserRanking {
  rating: number;
  rd: number;
  vol: number;
}

export interface User {
  username?: string;
  id: string;
  ranking?: UserRankings;
}
export interface GameResponse {
  id: string;
  variant: string;
  moves: MovesType[];
  config: { time_control?: ITimeControlConfig };
  players?: Array<User | undefined>;
  time_control?: ITimeControlBase;
  creator?: User;
  subscriptions?: GameSubscriptions;
}

// We may add more roles like "moderator" or "bot" in the future
export type UserRole = "admin";

export interface UserResponse {
  id: string;
  login_type: "guest" | "persistent";
  username?: string;
  ranking?: UserRankings;
  // undefined is just a normal user.
  role?: UserRole;
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

export type GameInitialResponse = Omit<GameResponse, "moves" | "timeControl"> &
  GameStateResponse & { subscription?: NotificationType[] };

export type NotificationsResponse = {
  gameId: string;
  notifications: GameNotification[];
  gameState: GameInitialResponse;
};
