import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { view_map } from "./view_map";
import { MovesType, makeGameObject } from "@ogfcommunity/variants-shared";

interface GameResponse {
  variant: string;
  moves: MovesType[];
  config: unknown;
}

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

  if (!game_id) {
    return <div>No game id provided.</div>;
  }

  if (!fetch_result) {
    return <div>Loading...</div>;
  }

  const GameViewComponent =
    view_map[fetch_result.variant as keyof typeof view_map];

  return (
    <>
      <GameViewComponent
        gamestate={gamestate}
        // TODO: implement making a move!
        onMove={() => {}}
      />
      <hr />
      <h2>Info</h2>
      <pre style={{ textAlign: "left" }}>
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
