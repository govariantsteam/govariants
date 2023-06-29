import { Baduk } from "../baduk";
import { Color } from "../../lib/abstractAlternatingOnGrid";
import { KoError } from "../../lib/ko_detector";

test("Play a game", () => {
  const game = new Baduk({ width: 4, height: 2, komi: 0.5 });
  // Tiny board:
  // - W B -
  // - W B -
  expect(game.nextToPlay()).toEqual([0]);
  game.playMove({ 0: "ca" });
  expect(game.nextToPlay()).toEqual([1]);
  game.playMove({ 1: "ba" });
  expect(game.nextToPlay()).toEqual([0]);
  game.playMove({ 0: "cb" });
  expect(game.nextToPlay()).toEqual([1]);
  game.playMove({ 1: "bb" });
  expect(game.nextToPlay()).toEqual([0]);

  // check that the final state is as expected
  expect(game.exportState().board).toEqual([
    [Color.EMPTY, Color.WHITE, Color.BLACK, Color.EMPTY],
    [Color.EMPTY, Color.WHITE, Color.BLACK, Color.EMPTY],
  ]);

  expect(game.phase).toBe("play");
  game.playMove({ 0: "pass" });
  expect(game.phase).toBe("play");
  game.playMove({ 1: "pass" });

  expect(game.phase).toBe("gameover");
  expect(game.result).toBe("W+0.5");
});

test("Play a game with captures", () => {
  const game = new Baduk({ width: 2, height: 2, komi: 0.5 });
  // Tiny board
  // B W
  // B .
  game.playMove({ 0: "aa" });
  game.playMove({ 1: "ba" });
  game.playMove({ 0: "ab" });
  expect(game.exportState().board).toEqual([
    [Color.BLACK, Color.WHITE],
    [Color.BLACK, Color.EMPTY],
  ]);

  // Tiny board
  // . W
  // . W
  game.playMove({ 1: "bb" });
  expect(game.exportState().board).toEqual([
    [Color.EMPTY, Color.WHITE],
    [Color.EMPTY, Color.WHITE],
  ]);

  expect(game.phase).toBe("play");
  game.playMove({ 0: "pass" });
  expect(game.phase).toBe("play");
  game.playMove({ 1: "pass" });
  expect(game.phase).toBe("gameover");
  expect(game.result).toBe("W+4.5");
});

test("Resign a game", () => {
  const game = new Baduk({ width: 19, height: 19, komi: 5.5 });
  game.playMove({ 0: "resign" });
  expect(game.phase).toBe("gameover");
  expect(game.result).toBe("W+R");
});

test("Scoring with open borders", () => {
  const game = new Baduk({ width: 5, height: 5, komi: 6.5 });
  game.playMove({ "0": "cb" });
  game.playMove({ "1": "cc" });
  game.playMove({ "0": "pass" });
  game.playMove({ "1": "pass" });

  expect(game.result).toBe("W+6.5");
});

test("ko", () => {
  // . B W .
  // B . B W
  // . B W .

  const game = new Baduk({
    width: 4,
    height: 3,
    komi: 6.5,
  });

  game.playMove({ "0": "ba" });
  game.playMove({ "1": "ca" });
  game.playMove({ "0": "ab" });
  game.playMove({ "1": "db" });
  game.playMove({ "0": "bc" });
  game.playMove({ "1": "cc" });
  game.playMove({ "0": "cb" });

  // White captures
  game.playMove({ "1": "bb" });

  // Black captures back
  expect(() => game.playMove({ "0": "cb" })).toThrow(KoError);
});
