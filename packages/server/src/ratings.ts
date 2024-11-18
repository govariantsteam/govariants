import {
  GameResponse,
  AbstractGame,
  UserRanking,
  UserRankings,
  UserResponse,
} from "@ogfcommunity/variants-shared";
import { Glicko2, Player } from "glicko2";
import { updateUserRanking, getUser } from "./users";



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

  const matches: [Player, Player, number][] = [];

  const variant = game.variant;

  let glicko_outcome;
  let outcome_player_black: "Win" | "Loss" | "Tie"
  let outcome_player_white: "Win" | "Loss" | "Tie"

  if (game_obj.result[0] === "B") {
    glicko_outcome = 1;
    outcome_player_black = "Win";
    outcome_player_white = "Loss";
  } else if (game_obj.result[0] === "W") {
    glicko_outcome = 0;
    outcome_player_black = "Loss";
    outcome_player_white = "Win";
  } else {
    glicko_outcome = 0.5;
    outcome_player_black = "Tie";
    outcome_player_white = "Tie";
  }
 
  const player_black_id = game.players[0].id;
  const player_white_id = game.players[1].id;

  const db_player_black = await getUser(player_black_id);
  const db_player_white = await getUser(player_white_id);

  const glicko_player_black = getGlickoPlayer(
    db_player_black.ranking[variant],
    ranking
  );
  const glicko_player_white = getGlickoPlayer(
    db_player_white.ranking[variant],
    ranking
  );

  matches.push([glicko_player_black, glicko_player_white, glicko_outcome]);

  ranking.updateRatings(matches);

  const player_black_new_ranking = userRankingFromGlickoPlayer(
    db_player_black,
    glicko_player_black,
    variant,
  );
  const player_white_new_ranking = userRankingFromGlickoPlayer(
    db_player_white,
    glicko_player_white,
    variant,
  );

  await Promise.all([
    updateUserRanking(player_black_id, player_black_new_ranking),
    updateUserRanking(player_white_id, player_white_new_ranking),
  ]);
}

function getGlickoPlayer(
  db_player_ranking: UserRanking,
  ranking: Glicko2
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

function userRankingFromGlickoPlayer(
  player: UserResponse,
  glicko_player: Player,
  variant: string,
): UserRankings {
  const player_ranking = player.ranking;

  const ranking: UserRanking = {
    rating: glicko_player.getRating(),
    rd: glicko_player.getRd(),
    vol: glicko_player.getVol(),
  };

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
    "sfractional"
  ].includes(variant);
}