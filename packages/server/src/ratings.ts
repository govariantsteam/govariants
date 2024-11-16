import {
    GameResponse,
    AbstractGame,
    UserRanking,
  } from "@ogfcommunity/variants-shared";
  import { Glicko2, Player } from "glicko2";
  import { updateUserRating, getUser } from "./users";
  
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
    // Rating system currently only for two player games
    const winner = game_obj.result[0] === "B" ? 1 : 0;
  
    const player_black_id = game.players[0].id;
    const player_white_id = game.players[1].id;
  
    const glicko_player_black = await getGlickoPlayer(player_black_id);
    const glicko_player_white = await getGlickoPlayer(player_white_id);

    matches.push([glicko_player_black, glicko_player_white, winner]);
  
    ranking.updateRatings(matches);
  
    const player_black_new_ranking = userRatingFromGlickoPlayer(glicko_player_black);
    const player_white_new_ranking = userRatingFromGlickoPlayer(glicko_player_white);
  
    await updateUserRating(player_black_id, player_black_new_ranking);
    await updateUserRating(player_white_id, player_white_new_ranking);
  
    //any return values?
  }
  
async function getGlickoPlayer(user_id: string): Promise<Player> {

  const db_player_ranking = (await getUser(user_id)).ranking;

  if (db_player_ranking == undefined) {
    return ranking.makePlayer(1500, 350, 0.06);
  }
  return ranking.makePlayer(
    db_player_ranking.rating,
    db_player_ranking.rd,
    db_player_ranking.vol,
  );
}

function userRatingFromGlickoPlayer(glicko_player: Player): UserRanking {
  return {
    rating: glicko_player.getRating(),
    rd: glicko_player.getRd(),
    vol: glicko_player.getVol(),
  };
}