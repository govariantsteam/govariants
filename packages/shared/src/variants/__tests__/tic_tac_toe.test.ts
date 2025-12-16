import { TicTacToe } from "../tic_tac_toe";

function playMoves(game: TicTacToe, moves: string[]) {
  moves.forEach((move, index) => game.playMove(index % 2, move));
}

test("wins on a horizontal line", () => {
  const game = new TicTacToe(TicTacToe.defaultConfig());
  playMoves(game, ["aa", "bb", "ab", "cc", "ac"]);

  expect(game.phase).toBe("gameover");
  expect(game.result).toContain("X");
});

test("detects a draw when the board is full", () => {
  const game = new TicTacToe(TicTacToe.defaultConfig());
  playMoves(game, ["aa", "bb", "ca", "ac", "ab", "ba", "bc", "cb", "cc"]);

  expect(game.phase).toBe("gameover");
  expect(game.result).toBe("Draw");
});

test("rejects placing on an occupied space", () => {
  const game = new TicTacToe(TicTacToe.defaultConfig());
  game.playMove(0, "aa");

  expect(() => game.playMove(1, "aa")).toThrow("occupied");
});
