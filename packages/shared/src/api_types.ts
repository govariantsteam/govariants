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
  players: Array<User | undefined>;
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

export type GameInitialResponse = Omit<
  GameResponse,
  "moves" | "timeControl" | "subscriptions"
> &
  GameStateResponse & { subscription?: NotificationType[] };

export type NotificationsResponse = {
  gameId: string;
  notifications: GameNotification[];
  gameState: GameInitialResponse | GameErrorResponse;
};

export type GameErrorResponse = {
  id: string;
  variant: string;
  errorMessage: string;
};

/** One bucket of the site-stats weekly game-creation series. */
export type WeeklyGameCount = {
  /** ISO date of the Monday that starts the (UTC) week. */
  weekStart: string;
  games: number;
};

export type VariantStats = {
  variant: string;
  games: number;
  gamesLast30Days: number;
  /** Games where every seat is occupied. */
  seatsFilled: number;
  /** Games with at least one move played. */
  withMoves: number;
  totalMoves: number;
};

export type TimeControlUsage = {
  /** Human-readable time control name, or "Unlimited" when none is configured. */
  label: string;
  games: number;
};

/**
 * Aggregate site usage, computed on demand from the games, users and sessions
 * collections. Deliberately contains no per-user or per-game identifiers.
 */
export type SiteStatsResponse = {
  generatedAt: string;
  games: {
    total: number;
    createdLast7Days: number;
    createdLast30Days: number;
    seatsFilled: number;
    withMoves: number;
    totalMoves: number;
  };
  users: {
    total: number;
    registered: number;
    guest: number;
    registeredLast30Days: number;
    /** Sessions whose cookie has not yet expired — a rough "recently active" count. */
    activeSessions: number;
  };
  variants: VariantStats[];
  weeklyGames: WeeklyGameCount[];
  timeControls: TimeControlUsage[];
};
