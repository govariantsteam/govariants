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
  
    const db_player_black_ranking = (await getUser(player_black_id)).ranking;
    const db_player_white_ranking = (await getUser(player_white_id)).ranking;
  
    let glicko_player_black;
    let glicko_player_white;
  
    if (db_player_black_ranking == undefined) {
      glicko_player_black = ranking.makePlayer(1500, 350, 0.06);
    } else {
      glicko_player_black = ranking.makePlayer(
        db_player_black_ranking.rating,
        db_player_black_ranking.rd,
        db_player_black_ranking.vol,
      );
    }
  
    if (db_player_white_ranking == undefined) {
      glicko_player_white = ranking.makePlayer(1500, 350, 0.06);
    } else {
      glicko_player_white = ranking.makePlayer(
        db_player_white_ranking.rating,
        db_player_white_ranking.rd,
        db_player_white_ranking.vol,
      );
    }
  
    matches.push([glicko_player_black, glicko_player_white, winner]);
  
    ranking.updateRatings(matches);
  
    const player_black_new_ranking: UserRanking = {
      rating: glicko_player_black.getRating(),
      rd: glicko_player_black.getRd(),
      vol: glicko_player_black.getVol(),
    };
  
    const player_white_new_ranking: UserRanking = {
      rating: glicko_player_white.getRating(),
      rd: glicko_player_white.getRd(),
      vol: glicko_player_white.getVol(),
    };
  
    await updateUserRating(player_black_id, player_black_new_ranking);
    await updateUserRating(player_white_id, player_white_new_ranking);
  
    //any return values?
  }
  