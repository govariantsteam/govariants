import { useEffect, useState } from "react";
import { GameResponse } from "@ogfcommunity/variants-shared";
import { Link } from "react-router-dom";

export function GameList() {
  const [games, setGames] = useState<GameResponse[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(`http://localhost:3000/games`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data);
      }

      setGames(data);
    };
    fetchData();
  });

  return (
    <div style={{ textAlign: "left" }}>
      {games.map((game) => (
        <Link to={`/game/${game.id}`}>
          <pre>{JSON.stringify(game, null, 2)}</pre>
        </Link>
      ))}
    </div>
  );
}
