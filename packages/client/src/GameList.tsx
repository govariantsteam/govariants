import { useEffect, useState } from "react";
import { GameResponse, getVariantList } from "@ogfcommunity/variants-shared";
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
  }, []);

  const [config_string, setConfigString] = useState(
    '{ "width": 19, "height": 19, "komi": 5.5 }'
  );
  const [variant, setVariant] = useState("baduk");
  const createGame = async () => {
    const headers = new Headers();
    headers.append("Origin", "http://localhost:3000");
    headers.append("Content-Type", "application/json");
    const response = await fetch(`http://localhost:3000/games`, {
      method: "post",
      body: JSON.stringify({ variant, config: JSON.parse(config_string) }),
      headers,
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data);
    }
  };

  return (
    <>
      <div style={{ textAlign: "left" }}>
        {games.map((game) => (
          <Link key={game.id} to={`/game/${game.id}`}>
            <pre>{JSON.stringify(game, null, 2)}</pre>
          </Link>
        ))}
      </div>
      <div>
        <label>Variant:</label>
        <select
          onChange={(ev) => {
            setVariant(ev.target.value);
          }}
        >
          {getVariantList().map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <label>Config: </label>
        <textarea
          onChange={(ev) => {
            setConfigString(ev.target.value);
          }}
          value={config_string}
        />
        <button onClick={createGame}>Create Game</button>
      </div>
    </>
  );
}
