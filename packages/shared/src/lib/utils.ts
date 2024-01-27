import { GamesFilter } from "../api_types";

export interface MovesType {
  [player: number]: string;
}

export function getOnlyMove(moves: MovesType): {
  player: number;
  move: string;
} {
  const players = Object.keys(moves);
  if (players.length > 1) {
    throw new Error(`More than one player: ${players}`);
  }
  if (players.length === 0) {
    throw new Error("No players specified!");
  }
  const player = Number(players[0]);
  return { player, move: moves[player] };
}

export type Participation = {
  playerNr: number;
  dropOutAtRound: number | null;
};

export function gamesFilterToUrlParams(filter: GamesFilter): string {
  return (
    (filter.user_id ? `&user_id=${filter.user_id}` : "") +
    (filter.variant === "" ? "" : `&variant=${filter.variant}`)
  );
}
