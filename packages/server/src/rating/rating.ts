import {
  GameResponse,
  AbstractGame,
  UserRanking,
  UserRankings,
  UserResponse,
} from "@ogfcommunity/variants-shared";
import { Glicko2, Player } from "glicko2";
import { updateUserRanking, getUser } from "../users";

export async function updateRatings(
  game: GameResponse,
  game_obj: AbstractGame<object, object>,
) {
  const ranking = new Glicko2({
    tau: 0.5,
    rating: 1500,
    rd: 350,
    vol: 0.06,
  });

  const variant = game.variant;

  const glicko_outcome = getGlickoResult(game_obj.result[0]);

  const player_black_id = game.players[0].id;
  const player_white_id = game.players[1].id;

  const db_player_black = await getUser(player_black_id);
  const db_player_white = await getUser(player_white_id);

  const glicko_player_black = getGlickoPlayer(
    db_player_black.ranking[variant],
    ranking,
  );
  const glicko_player_white = getGlickoPlayer(
    db_player_white.ranking[variant],
    ranking,
  );

  ranking.addResult(glicko_player_black, glicko_player_white, glicko_outcome);

  ranking.calculatePlayersRatings();

  const player_black_new_ranking = applyPlayerRankingToUserResponse(
    db_player_black,
    glicko_player_black,
    variant,
  );
  const player_white_new_ranking = applyPlayerRankingToUserResponse(
    db_player_white,
    glicko_player_white,
    variant,
  );

  await Promise.all([
    updateUserRanking(player_black_id, player_black_new_ranking),
    updateUserRanking(player_white_id, player_white_new_ranking),
  ]);
}

export function getGlickoResult(game_result: string): number {
  if (game_result === "B") {
    return 1;
  }
  if (game_result === "W") {
    return 0;
  }
  return 0.5;
}

export function getGlickoPlayer(
  db_player_ranking: UserRanking,
  ranking: Glicko2,
): Player {
  if (db_player_ranking == undefined) {
    return ranking.makePlayer(1500, 350, 0.06);
  }
  return ranking.makePlayer(
    db_player_ranking.rating,
    db_player_ranking.rd,
    db_player_ranking.vol,
  );
}

// this function updates player's UserRanking with new ratings
export function applyPlayerRankingToUserResponse(
  player: UserResponse,
  glicko_player: Player,
  variant: string,
): UserRankings {
  const ranking: UserRanking = {
    rating: glicko_player.getRating(),
    rd: glicko_player.getRd(),
    vol: glicko_player.getVol(),
  };

  const player_ranking = player.ranking;
  player_ranking[variant] = ranking;
  return player_ranking;
}

export function supportsRatings(variant: string) {
  return [
    "baduk",
    "phantom",
    "capture",
    "tetris",
    "pyramid",
    "thue-morse",
    "freeze",
    "fractional",
    "keima",
    "one color",
    "drift",
    "quantum",
    "sfractional",
  ].includes(variant);
}
