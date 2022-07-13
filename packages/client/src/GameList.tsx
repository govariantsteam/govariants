import { useEffect, useState } from "react";
import { GameResponse } from "@ogfcommunity/variants-shared";
import { Link } from "react-router-dom";
import * as requests from "./requests";
import { view_map } from "./view_map";
import { getStateFromMoves } from "./GamePage";

export function GameList() {
  const [games, setGames] = useState<GameResponse[]>([]);

  useEffect(() => {
    requests.get("/games").then(setGames);
  }, []);

  return (
    <>
      <div className="game-list">
        {games.map((game) => {
          const GameViewComponent =
            view_map[game.variant as keyof typeof view_map];
          const game_info = `variant: ${game.variant}\nconfig: ${JSON.stringify(
            game.config,
            null,
            2
          )}`;
          const gamestate: any = undefined;
          try {
            getStateFromMoves(game.variant, game.moves, game.config);
          } catch {
            // do nothing
          }

          return (
            <div className="game-summary">
              <Link key={game.id} to={`/game/${game.id}`}>
                <span className="mini-game">
                  {gamestate && (
                    <GameViewComponent
                      gamestate={getStateFromMoves(
                        game.variant,
                        game.moves,
                        game.config
                      )}
                      onMove={() => {}}
                    />
                  )}
                </span>
                <span>
                  <pre>{game_info}</pre>
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
}
