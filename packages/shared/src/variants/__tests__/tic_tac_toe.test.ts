import { TicTacToe } from "../tic_tac_toe";

// These variables just make the boards a little prettier
const X = 0;
const _ = null;
const O = 1;

test("Play a game", () => {
  const game = new TicTacToe({});
  // Tiny board:
  // O - -
  // - X -
  // - - X

  game.playMove(0, "bb");
  game.playMove(1, "aa");
  game.playMove(0, "cc");

  expect(game.exportState().board).toEqual([
    [O, _, _],
    [_, X, _],
    [_, _, X],
  ]);
});
