import { getVariantList } from "@ogfcommunity/variants-shared";
import * as requests from "./requests";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function GameCreationForm() {
  const [config_string, setConfigString] = useState(
    '{ "width": 19, "height": 19, "komi": 5.5 }'
  );
  const [variant, setVariant] = useState("baduk");
  const navigate = useNavigate();
  const createGame = async () => {
    requests
      .post("/games", { variant, config: JSON.parse(config_string) })
      .then((game) => navigate(`/game/${game.id}`));
  };

  return (
    <div className="game-creation-form">
      <h3>Create a game</h3>
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
      </div>
      <div>
        <label>Config: </label>
        <textarea
          onChange={(ev) => {
            setConfigString(ev.target.value);
          }}
          value={config_string}
        />
      </div>
      <button onClick={createGame}>Create Game</button>
    </div>
  );
}
