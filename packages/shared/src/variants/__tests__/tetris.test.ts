import { TetrisGo } from "../tetris";
import { Color } from "../../lib/abstractAlternatingOnGrid";

test("Play a game", () => {
  const game = new TetrisGo({ width: 4, height: 2, komi: 0.5 });
  // Tiny board:
  // - W B -
  // - W B -
  expect(game.nextToPlay()).toEqual([0]);
  game.playMove(0, "ca");
  expect(game.nextToPlay()).toEqual([1]);
  game.playMove(1, "ba");
  expect(game.nextToPlay()).toEqual([0]);
  game.playMove(0, "cb");
  expect(game.nextToPlay()).toEqual([1]);
  game.playMove(1, "bb");
  expect(game.nextToPlay()).toEqual([0]);

  // check that the final state is as expected
  expect(game.exportState().board).toEqual([
    [Color.EMPTY, Color.WHITE, Color.BLACK, Color.EMPTY],
    [Color.EMPTY, Color.WHITE, Color.BLACK, Color.EMPTY],
  ]);

  expect(game.phase).toBe("play");
  game.playMove(0, "pass");
  expect(game.phase).toBe("play");
  game.playMove(1, "pass");

  expect(game.phase).toBe("gameover");
  expect(game.result).toBe("W+0.5");
});

test("four stone group throws", () => {
  const game = new TetrisGo({ width: 4, height: 2, komi: 0.5 });
  // Tiny board:
  // B B B<B>
  // W W W -
  game.playMove(0, "aa");
  game.playMove(1, "ab");
  game.playMove(0, "ba");
  game.playMove(1, "bb");
  game.playMove(0, "ca");
  game.playMove(1, "cb");

  //check that the final state is as expected
  expect(() => {
    game.playMove(0, "da");
  }).toThrow("four stones");
});
