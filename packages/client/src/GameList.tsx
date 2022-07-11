import { useEffect, useState } from "react";
import { GameResponse } from "@ogfcommunity/variants-shared";
import { Link } from "react-router-dom";
import * as requests from "./requests";

export function GameList() {
  const [games, setGames] = useState<GameResponse[]>([]);

  useEffect(() => {
    requests.get("/games").then(setGames);
  }, []);

  return (
    <>
      <div style={{ textAlign: "left" }}>
        {games.map((game) => (
          <Link key={game.id} to={`/game/${game.id}`}>
            <pre>{JSON.stringify(game, null, 2)}</pre>
          </Link>
        ))}
      </div>
    </>
  );
}
