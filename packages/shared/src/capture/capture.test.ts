import { Capture } from "./capture";
import { Color } from "../abstractAlternatingOnGrid";

test("White wins by capture", () => {
  const game = new Capture({ width: 2, height: 2, komi: 0.5 });
  // Tiny board
  // B W
  // B O
  game.playMove({ 0: "aa" });
  game.playMove({ 1: "ba" });
  game.playMove({ 0: "ab" });

  // capture the black stones on the left
  game.playMove({ 1: "bb" });

  expect(game.exportState().board).toEqual([
    [Color.EMPTY, Color.WHITE],
    [Color.EMPTY, Color.WHITE],
  ]);

  expect(game.phase).toBe("gameover");
  expect(game.result).toBe("W+Capture");
});

test("Black wins by capture", () => {
  const game = new Capture({ width: 2, height: 2, komi: 0.5 });
  // Tiny board
  // B W
  // . .
  game.playMove({ 0: "aa" });
  game.playMove({ 1: "ba" });

  // capture the white stone on the left
  game.playMove({ 0: "bb" });

  expect(game.exportState().board).toEqual([
    [Color.BLACK, Color.EMPTY],
    [Color.EMPTY, Color.BLACK],
  ]);
  expect(game.phase).toBe("gameover");
  expect(game.result).toBe("B+Capture");
});
