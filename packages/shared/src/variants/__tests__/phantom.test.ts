import { Phantom } from "../phantom";
import { Color } from "../baduk";

test("Play a game", () => {
  const game = new Phantom({ width: 4, height: 2, komi: 0.5 });
  // Tiny board:
  // - W B -
  // - W B -
  game.playMove(0, "ca");
  game.playMove(1, "ba");
  game.playMove(0, "cb");
  game.playMove(1, "bb");

  // spectators should see an empty board (no second-tab cheating)
  expect(game.exportState().board).toEqual([
    [Color.EMPTY, Color.EMPTY, Color.EMPTY, Color.EMPTY],
    [Color.EMPTY, Color.EMPTY, Color.EMPTY, Color.EMPTY],
  ]);

  // BLACK should not see WHITE
  expect(game.exportState(0).board).toEqual([
    [Color.EMPTY, Color.EMPTY, Color.BLACK, Color.EMPTY],
    [Color.EMPTY, Color.EMPTY, Color.BLACK, Color.EMPTY],
  ]);

  // WHITE should not see BLACK
  expect(game.exportState(1).board).toEqual([
    [Color.EMPTY, Color.WHITE, Color.EMPTY, Color.EMPTY],
    [Color.EMPTY, Color.WHITE, Color.EMPTY, Color.EMPTY],
  ]);
});

test("Play a game with captures", () => {
  const game = new Phantom({ width: 2, height: 2, komi: 0.5 });
  // Tiny board
  // B W
  // B O
  game.playMove(0, "aa");
  game.playMove(1, "ba");
  game.playMove(0, "ab");
  game.playMove(1, "bb");

  expect(game.exportState().board).toEqual([
    [Color.EMPTY, Color.EMPTY],
    [Color.EMPTY, Color.EMPTY],
  ]);
  expect(game.exportState(0).board).toEqual([
    [Color.EMPTY, Color.EMPTY],
    [Color.EMPTY, Color.EMPTY],
  ]);
  expect(game.exportState(1).board).toEqual([
    [Color.EMPTY, Color.WHITE],
    [Color.EMPTY, Color.WHITE],
  ]);
  expect(game.exportState().captures).toEqual({ "0": 0, "1": 2 });
  expect(game.exportState(0).captures).toEqual({ "0": 0, "1": 2 });
  expect(game.exportState(1).captures).toEqual({ "0": 0, "1": 2 });
});

test("Reveals full board to everyone after the game ends", () => {
  const game = new Phantom({ width: 4, height: 2, komi: 0.5 });
  // - W B -
  // - W B -
  game.playMove(0, "ca");
  game.playMove(1, "ba");
  game.playMove(0, "cb");
  game.playMove(1, "bb");
  game.playMove(0, "pass");
  game.playMove(1, "pass");

  const fullBoard = [
    [Color.EMPTY, Color.WHITE, Color.BLACK, Color.EMPTY],
    [Color.EMPTY, Color.WHITE, Color.BLACK, Color.EMPTY],
  ];

  expect(game.exportState().board).toEqual(fullBoard);
  expect(game.exportState(0).board).toEqual(fullBoard);
  expect(game.exportState(1).board).toEqual(fullBoard);
});
