import {
  GameResponse,
  makeGameObject,
  MovesType,
} from "@ogfcommunity/variants-shared";

// TODO: Persist games in a database and remove dummy_games
const dummy_games: GameResponse[] = [
  {
    id: 0,
    variant: "baduk",
    moves: [{ 0: "aa" }, { 1: "bb" }, { 0: "cc" }],
    config: { width: 19, height: 19, komi: 5.5 },
  },
  {
    id: 1,
    variant: "baduk",
    moves: [{ 0: "aa" }, { 1: "bb" }, { 0: "cc" }],
    config: { width: 13, height: 13, komi: 5.5 },
  },
  {
    id: 2,
    variant: "baduk",
    moves: [{ 0: "aa" }, { 1: "bb" }, { 0: "cc" }],
    config: { width: 9, height: 9, komi: 5.5 },
  },
];

const PAGE_SIZE = 10;

export function getGames(page: number) {
  const end = Math.max(0, dummy_games.length - page * PAGE_SIZE);
  const start = Math.max(0, end - PAGE_SIZE);
  return dummy_games.slice(start, end).reverse();
}

export function getGame(id: number) {
  const game = dummy_games[id];
  if (!game) {
    throw new Error(`No game with id ${id}`);
  }
  return dummy_games[id];
}

export function createGame(variant: string, config: any) {
  const game: GameResponse = {
    id: dummy_games.length,
    variant: variant,
    moves: [],
    config: config,
  };

  // Check that the config is valid
  makeGameObject(variant, config);

  dummy_games.push(game);
  return game;
}

export function playMove(game_id: number, move: MovesType) {
  const game = dummy_games[game_id];

  // Verify that moves are legal
  const game_obj = makeGameObject(game.variant, game.config);
  game.moves.forEach((move) => {
    game_obj.playMove(move);
  });
  game_obj.playMove(move);

  game.moves.push(move);

  return game;
}
