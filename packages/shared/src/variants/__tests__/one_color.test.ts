import { Color } from "../baduk";
import { OneColorGo } from "../one_color";

const B = Color.BLACK;
const _ = Color.EMPTY;
const W = Color.WHITE;

test("Play a game", () => {
  const game = new OneColorGo({ width: 4, height: 2, komi: 0.5 });
  // Tiny board:
  // - W B -
  // - W B -
  game.playMove(0, "ca");
  game.playMove(1, "ba");
  game.playMove(0, "cb");
  game.playMove(1, "bb");

  // check that the final state is as expected
  expect(game.exportState({ phase: "play" }).board).toEqual([
    [_, W, W, _],
    [_, W, W, _],
  ]);

  game.playMove(0, "pass");
  game.playMove(1, "pass");

  expect(game.phase).toBe("gameover");
  expect(game.exportState({ phase: "play" }).score_board).toEqual([
    [W, W, B, B],
    [W, W, B, B],
  ]);
});

test("Final state of a completed game: everyone sees true colors", () => {
  const game = new OneColorGo({ width: 4, height: 2, komi: 0.5 });
  // - W B -
  // - W B -
  game.playMove(0, "ca");
  game.playMove(1, "ba");
  game.playMove(0, "cb");
  game.playMove(1, "bb");
  game.playMove(0, "pass");
  game.playMove(1, "pass");

  expect(game.phase).toBe("gameover");

  const trueColors = [
    [_, W, B, _],
    [_, W, B, _],
  ];

  expect(game.exportState({ phase: "gameover" }).board).toEqual(trueColors);
  expect(game.exportState({ player: 0, phase: "gameover" }).board).toEqual(
    trueColors,
  );
  expect(game.exportState({ player: 1, phase: "gameover" }).board).toEqual(
    trueColors,
  );
});

test("History review: observer sees true colors, seated stays obfuscated", () => {
  // Mid-game — `this.phase` is still "play". Server passes context.phase =
  // "gameover" when the overall game has ended.
  const game = new OneColorGo({ width: 4, height: 2, komi: 0.5 });
  game.playMove(0, "ca");
  game.playMove(1, "ba");
  game.playMove(0, "cb");
  game.playMove(1, "bb");

  expect(game.phase).toBe("play");

  const obfuscated = [
    [_, W, W, _],
    [_, W, W, _],
  ];
  const trueColors = [
    [_, W, B, _],
    [_, W, B, _],
  ];

  // Observer gets the reveal.
  expect(game.exportState({ phase: "gameover" }).board).toEqual(trueColors);

  // Seated players keep the obfuscated view they had during live play.
  expect(game.exportState({ player: 0, phase: "gameover" }).board).toEqual(
    obfuscated,
  );
  expect(game.exportState({ player: 1, phase: "gameover" }).board).toEqual(
    obfuscated,
  );
});
