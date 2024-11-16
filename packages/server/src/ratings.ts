import {
  GameResponse,
  AbstractGame,
  UserRanking,
  UserRankings,
  UserResponse,
  GameResult,
  GameResults,
} from "@ogfcommunity/variants-shared";
import { Glicko2, Player } from "glicko2";
import { updateUserRanking, getUser, updateUserGameHistory } from "./users";

const ranking = new Glicko2({
  tau: 0.5,
  rating: 1500,
  rd: 350,
  vol: 0.06,
});

const matches: [Player, Player, number][] = [];

export async function updateRatings(
  game: GameResponse,
  game_obj: AbstractGame<object, object>,
) {
  const variant = game.variant;

  let glicko_outcome;
  let outcome_player_black;
  let outcome_player_white;

  if (game_obj.result.endsWith("R")) {
    if (game_obj.result[0] === "B") {
      glicko_outcome = 0;
      outcome_player_black = "Loss";
      outcome_player_white = "Win";
    } else if (game_obj.result[0] === "W") {
      glicko_outcome = 1;
      outcome_player_black = "Win";
      outcome_player_white = "Loss";
    }
  } else {
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
  }

  const player_black_id = game.players[0].id;
  const player_white_id = game.players[1].id;

  const db_player_black = await getUser(player_black_id);
  const db_player_white = await getUser(player_white_id);

  if (db_player_black.ranking == undefined) {
    db_player_black.ranking = {};
  }
  if (db_player_white.ranking == undefined) {
    db_player_white.ranking = {};
  }

  const new_game_history_player_black = updatedGameHistory(
    db_player_black,
    db_player_white.ranking[variant],
    outcome_player_black,
    variant,
  );
  const new_game_history_player_white = updatedGameHistory(
    db_player_white,
    db_player_black.ranking[variant],
    outcome_player_white,
    variant,
  );

  await Promise.all([
    updateUserGameHistory(player_black_id, new_game_history_player_black),
    updateUserGameHistory(player_white_id, new_game_history_player_white),
  ]);

  const glicko_player_black = await getGlickoPlayer(
    db_player_black.ranking[variant],
  );
  const glicko_player_white = await getGlickoPlayer(
    db_player_white.ranking[variant],
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

async function getGlickoPlayer(
  db_player_ranking: UserRanking,
): Promise<Player> {
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

function updatedGameHistory(
  player: UserResponse,
  opponentRating: UserRanking,
  game_result: string,
  variant: string,
): GameResults {
  let player_game_history = player.gameHistory;

  if (player_game_history == undefined) {
    player_game_history = {};
  }
  if (player_game_history[variant] == undefined) {
    player_game_history[variant] = [];
  }

  const new_game_history: GameResult = {
    opponentRating: opponentRating,
    result: game_result as "Win" | "Loss" | "Tie",
  };

  player_game_history[variant].push(new_game_history);
  return player_game_history;
}
