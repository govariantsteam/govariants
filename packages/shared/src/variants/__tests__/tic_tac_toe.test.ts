import { TicTacToe } from "../tic_tac_toe";

// These variables just make the boards a little prettier
const X = 0;
const _ = null;
const O = 1;

test("Play a game", () => {
  const game = new TicTacToe();
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

test("Don't allow player to move when it's not their turn", () => {
  const game1 = new TicTacToe();
  const game2 = new TicTacToe();

  game2.playMove(0, "aa");

  // In both cases, these are the wrong players to play.
  // the game object should throw an Error
  expect(() => game1.playMove(1, "aa")).toThrow("Not O's turn!");
  expect(() => game2.playMove(0, "bb")).toThrow("Not X's turn!");
});
