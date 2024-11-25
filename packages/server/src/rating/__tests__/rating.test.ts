import {
    getGlickoPlayer,
    userRankingFromGlickoPlayer,
    supportsRatings,
    getGlickoResult,
  } from "../rating";
  import { Glicko2 } from "glicko2";
  import { UserRanking, UserResponse } from "@ogfcommunity/variants-shared";
  
  test("supportsRatings", () => {
    const supportsRating = supportsRatings("chess");
    expect(supportsRating).toEqual(false);
  
    const new_supportsRating = supportsRatings("quantum");
    expect(new_supportsRating).toEqual(true);
  });
  
  test("getGlickoPlayer - with typical player value", () => {
    const db_player = {
      id: "672844d2254d76r4387b8488",
      login_type: "persistent",
      username: "testUser",
      ranking: {
        quantum: {
          rating: 1337,
          rd: 290,
          vol: 0.0599,
        },
        baduk: {
          rating: 1623,
          rd: 290,
          vol: 0.0599,
        },
        phantom: {
          rating: 1762,
          rd: 290,
          vol: 0.0599,
        },
      },
    };
  
    const db_player_ranking_quantum = db_player.ranking["quantum"];
  
    const ranking = new Glicko2({
      tau: 0.5,
      rating: 1500,
      rd: 350,
      vol: 0.06,
    });
  
    const new_ranking = new Glicko2({
      tau: 0.5,
      rating: 1500,
      rd: 350,
      vol: 0.06,
    });
  
    expect(getGlickoPlayer(db_player_ranking_quantum, ranking)).toEqual(
      new_ranking.makePlayer(
        db_player_ranking_quantum.rating,
        db_player_ranking_quantum.rd,
        db_player_ranking_quantum.vol,
      ),
    );
  });
  
  test("getGlickoPlayer - when player does not have any rating", () => {
    const db_player_ranking_quantum: undefined = undefined;
  
    const ranking = new Glicko2({
      tau: 0.5,
      rating: 1500,
      rd: 350,
      vol: 0.06,
    });
  
    const new_ranking = new Glicko2({
      tau: 0.5,
      rating: 1500,
      rd: 350,
      vol: 0.06,
    });
  
    expect(getGlickoPlayer(db_player_ranking_quantum, ranking)).toEqual(
      new_ranking.makePlayer(1500, 350, 0.06),
    );
  });
  
  // do we need to run tests for very simple functions?
  test("getGlickoResult", () => {
    expect(getGlickoResult("B")).toBe(1);
    expect(getGlickoResult("W")).toBe(0);
    expect(getGlickoResult("T")).toBe(0.5);
  });
  
  test("userRankingFromGlickoPlayer", () => {
    const variant = "quantum";
    const glicko_ranking = new Glicko2({
      tau: 0.5,
      rating: 1500,
      rd: 350,
      vol: 0.06,
    });
    const db_player_initial: UserResponse = {
      id: "672844d2254d76r4387b8488",
      login_type: "persistent",
      username: "testUser",
      ranking: {
        quantum: {
          rating: 1337,
          rd: 290,
          vol: 0.0599,
        },
        baduk: {
          rating: 1623,
          rd: 290,
          vol: 0.0599,
        },
        phantom: {
          rating: 1762,
          rd: 290,
          vol: 0.0599,
        },
      },
    };
  
    const new_quantum_ranking: UserRanking = {
      rating: 1667,
      rd: 295,
      vol: 0.0699,
    };
  
    const glicko_player = getGlickoPlayer(new_quantum_ranking, glicko_ranking);
  
    const expected_player: UserResponse = {
      id: "672844d2254d76r4387b8488",
      login_type: "persistent",
      username: "testUser",
      ranking: {
        quantum: {
          rating: 1667,
          rd: 295,
          vol: 0.0699,
        },
        baduk: {
          rating: 1623,
          rd: 290,
          vol: 0.0599,
        },
        phantom: {
          rating: 1762,
          rd: 290,
          vol: 0.0599,
        },
      },
    };
  
    expect(
      userRankingFromGlickoPlayer(db_player_initial, glicko_player, variant),
    ).toEqual(expected_player.ranking);
  });
  