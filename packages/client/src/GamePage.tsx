import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { view_map } from "./view_map";
import {
  MovesType,
  makeGameObject,
  GameResponse,
} from "@ogfcommunity/variants-shared";

export function GamePage(): JSX.Element {
  const [fetch_result, setFetchResult] = useState<GameResponse>();
  const [gamestate, setGameState] = useState<any>();

  const { game_id } = useParams<"game_id">();

  const fetchData = async (game_id: string) => {
    const response = await fetch(`http://localhost:3000/games/${game_id}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data);
    }

    setFetchResult(data);
    setGameState(getStateFromMoves(data.variant, data.moves, data.config));
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

    const headers = new Headers();
    headers.append("Origin", "http://localhost:3000");
    headers.append("Content-Type", "application/json");
    const response = await fetch(
      `http://localhost:3000/games/${fetch_result.id}/move`,
      {
        method: "post",
        body: JSON.stringify(move),
        headers,
      }
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data);
    }

    fetchData(game_id);
  };

  return (
    <>
      <GameViewComponent gamestate={gamestate} onMove={onMove} />
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

function getStateFromMoves(
  variant: keyof typeof view_map,
  moves: MovesType[],
  config: any
): any {
  const game = makeGameObject(variant, config);
  moves.forEach((move) => {
    game.playMove(move as any);
  });
  return game.exportState();
}
