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
  expect(game.exportState({ player: 0, phase: "play" }).board).toEqual([
    [Color.EMPTY, Color.EMPTY, Color.BLACK, Color.EMPTY],
    [Color.EMPTY, Color.EMPTY, Color.BLACK, Color.EMPTY],
  ]);

  // WHITE should not see BLACK
  expect(game.exportState({ player: 1, phase: "play" }).board).toEqual([
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
  expect(game.exportState({ player: 0, phase: "play" }).board).toEqual([
    [Color.EMPTY, Color.EMPTY],
    [Color.EMPTY, Color.EMPTY],
  ]);
  expect(game.exportState({ player: 1, phase: "play" }).board).toEqual([
    [Color.EMPTY, Color.WHITE],
    [Color.EMPTY, Color.WHITE],
  ]);
  expect(game.exportState().captures).toEqual({ "0": 0, "1": 2 });
  expect(game.exportState({ player: 0, phase: "play" }).captures).toEqual({
    "0": 0,
    "1": 2,
  });
  expect(game.exportState({ player: 1, phase: "play" }).captures).toEqual({
    "0": 0,
    "1": 2,
  });
});

test("Reveals full board to everyone when context.phase is gameover", () => {
  // Mid-game position — exercising the history-review path where the game
  // object's own phase is still "play" but the caller knows the overall game
  // has ended.
  const game = new Phantom({ width: 4, height: 2, komi: 0.5 });
  // - W B -
  // - W B -
  game.playMove(0, "ca");
  game.playMove(1, "ba");
  game.playMove(0, "cb");
  game.playMove(1, "bb");

  expect(game.phase).toBe("play");

  const fullBoard = [
    [Color.EMPTY, Color.WHITE, Color.BLACK, Color.EMPTY],
    [Color.EMPTY, Color.WHITE, Color.BLACK, Color.EMPTY],
  ];

  expect(game.exportState({ phase: "gameover" }).board).toEqual(fullBoard);
  expect(game.exportState({ player: 0, phase: "gameover" }).board).toEqual(
    fullBoard,
  );
  expect(game.exportState({ player: 1, phase: "gameover" }).board).toEqual(
    fullBoard,
  );
});
