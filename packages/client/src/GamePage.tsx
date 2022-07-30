import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  MovesType,
  makeGameObject,
  GameResponse,
  AbstractGame,
} from "@ogfcommunity/variants-shared";
import * as requests from "./requests";
import "./GamePage.css";
import { SafeGameView } from "./SafeGameView";

export function GamePage(): JSX.Element {
  const [fetch_result, setFetchResult] = useState<GameResponse>();
  const [game, setGame] = useState<AbstractGame>();
  const [error, setError] = useState<string>();
  const [player, setPlayer] = useState<number>(0);

  const { game_id } = useParams<"game_id">();

  const fetchData = async (game_id: string) => {
    requests.get(`/games/${game_id}`).then((data) => {
      setFetchResult(data);
      setError(undefined);
      try {
        const game = makeGameObjectWithMoves(
          data.variant,
          data.moves,
          data.config
        );
        setGame(makeGameObjectWithMoves(data.variant, data.moves, data.config));
        setPlayer(game.nextToPlay()[0]);
      } catch (e) {
        console.log(e);
        setError(String(e));
      }
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

  const onMove = async (move: MovesType) => {
    if (!game || game.result !== "") {
      return;
    }

    setLastMove(JSON.stringify(move));

    requests
      .post(`/games/${fetch_result.id}/move`, move)
      .then(() => fetchData(game_id));
  };
  const onSpecialMove = (special_move: string) => {
    onMove({ [player]: special_move });
  };

  return (
    <>
      <div className="game-container">
        {game ? (
          <>
            <SafeGameView
              gamestate={game.exportState()}
              onMove={onMove}
              variant={fetch_result.variant}
            />
            <span>{game.result}</span>
            <span>Special moves:</span>
            {game &&
              Object.entries(game.specialMoves()).map(([move, prettyMove]) => (
                <button onClick={() => onSpecialMove(move)}>
                  {prettyMove}
                </button>
              ))}
            <span>Player:</span>
            <select
              onChange={(ev) => {
                setPlayer(Number(ev.target.value));
              }}
              value={player}
            >
              {game.nextToPlay().map((player) => (
                <option key={player} value={player}>
                  {player}
                </option>
              ))}
            </select>
          </>
        ) : (
          error
        )}
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

export function makeGameObjectWithMoves(
  variant: string,
  moves: MovesType[],
  config: any
): AbstractGame<any, any> {
  const game = makeGameObject(variant, config);
  moves.forEach((move) => {
    game.playMove(move);
  });
  return game;
}
