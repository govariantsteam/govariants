import { ThueMorse } from "../thue_morse";
import { Color } from "../../lib/abstractAlternatingOnGrid";

const B = Color.BLACK;
const _ = Color.EMPTY;
const W = Color.WHITE;

test("Play a game - wrong player", () => {
  const game = new ThueMorse({ width: 2, height: 2, komi: 0.5 });

  expect(game.nextToPlay()).toEqual([0]);
  game.playMove({ 0: "aa" });
  expect(game.nextToPlay()).toEqual([1]);
  game.playMove({ 1: "ab" });
  expect(game.nextToPlay()).toEqual([1]);
  expect(() => game.playMove({ 0: "ba" })).toThrow("It's not player 0's turn!");
});

test("Play a game", () => {
  const game = new ThueMorse({ width: 4, height: 2, komi: 0.5 });
  // Tiny board:
  // - W B -
  // - W B -
  expect(game.nextToPlay()).toEqual([0]);
  game.playMove({ 0: "ca" });
  expect(game.nextToPlay()).toEqual([1]);
  game.playMove({ 1: "ba" });
  expect(game.nextToPlay()).toEqual([1]);
  game.playMove({ 1: "bb" });
  expect(game.nextToPlay()).toEqual([0]);
  game.playMove({ 0: "cb" });
  expect(game.nextToPlay()).toEqual([1]);
  game.playMove({ 1: "aa" });

  // check that the final state is as expected
  expect(game.exportState().board).toEqual([
    [W, W, B, _],
    [_, W, B, _],
  ]);

  expect(game.phase).toBe("play");
  game.playMove({ 0: "pass" });
  // technically, 0 is the next player in Thue-Morse, but
  // don't really need to force them to pass twice...
  expect(game.phase).toBe("play");
  game.playMove({ 1: "pass" });

  expect(game.phase).toBe("gameover");
  expect(game.result).toBe("W+0.5");
  expect(game.exportState().score_board).toEqual([
    [W, W, B, B],
    [W, W, B, B],
  ]);
});
