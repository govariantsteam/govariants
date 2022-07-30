import { useEffect, useState } from "react";
import { GameResponse } from "@ogfcommunity/variants-shared";
import { Link } from "react-router-dom";
import * as requests from "./requests";
import { makeGameObjectWithMoves } from "./GamePage";
import { SafeGameView } from "./SafeGameView";

export function GameList() {
  const [games, setGames] = useState<GameResponse[]>([]);

  useEffect(() => {
    requests.get("/games").then(setGames);
  }, []);

  return (
    <>
      <div className="game-list">
        {games.map((game) => {
          const game_info = `variant: ${game.variant}\nconfig: ${JSON.stringify(
            game.config,
            null,
            2
          )}`;
          let gamestate: any;
          try {
            gamestate = makeGameObjectWithMoves(
              game.variant,
              game.moves,
              game.config
            ).exportState();
          } catch {
            // do nothing
          }

          return (
            <Link key={game.id} to={`/game/${game.id}`}>
              <div className="game-summary">
                <span className="mini-game">
                  {gamestate && (
                    <SafeGameView
                      variant={game.variant}
                      gamestate={gamestate}
                      onMove={() => {}}
                    />
                  )}
                </span>
                <span>
                  <pre>{game_info}</pre>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

