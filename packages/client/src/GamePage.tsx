import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { view_map } from "./view_map";
import {
  MovesType,
  makeGameObject,
  GameResponse,
} from "@ogfcommunity/variants-shared";
import * as requests from "./requests";
import "./GamePage.css";

export function GamePage(): JSX.Element {
  const [fetch_result, setFetchResult] = useState<GameResponse>();
  const [gamestate, setGameState] = useState<any>();
  const [error, setError] = useState<string>();

  const { game_id } = useParams<"game_id">();

  const fetchData = async (game_id: string) => {
    requests.get(`/games/${game_id}`).then((data) => {
      setFetchResult(data);
      let gamestate: any;
      setError(undefined);
      try {
        gamestate = getStateFromMoves(data.variant, data.moves, data.config);
      } catch (e) {
        console.log(e);
        setError(String(e));
      }
      setGameState(gamestate);
    });
  };

  useEffect(() => {
    if (game_id) {
      fetchData(game_id);
    }
  }, [game_id]);

  const [last_move, setLastMove] = useState("null");

  if (!game_id) {
    return <div>No game id provided.</div>;
  }

  if (!fetch_result) {
    return <div>Loading...</div>;
  }

  const GameViewComponent =
    view_map[fetch_result.variant as keyof typeof view_map];

  const onMove = async (move: MovesType) => {
    setLastMove(JSON.stringify(move));

    requests
      .post(`/games/${fetch_result.id}/move`, move)
      .then(() => fetchData(game_id));
  };

  return (
    <>
      <div className="game-container">
        {error || <GameViewComponent gamestate={gamestate} onMove={onMove} />}
      </div>
      <hr />
      <h2>Info</h2>
      <div style={{ textAlign: "left" }}>
        <span>Last Move from this client: </span>
        {last_move}
      </div>
      <pre style={{ textAlign: "left" }}>
        <span>{`from /games/${fetch_result.id}`}</span>
        {JSON.stringify(fetch_result, null, 2)}
      </pre>
    </>
  );
}

export function getStateFromMoves(
  variant: string,
  moves: MovesType[],
  config: any
): any {
  const game = makeGameObject(variant, config);
  moves.forEach((move) => {
    game.playMove(move);
  });
  return game.exportState();
}
