import { Keima } from "../keima";
import { Color } from "../baduk";

const B = Color.BLACK;
const _ = Color.EMPTY;
const W = Color.WHITE;

test("Play a game - wrong player", () => {
  const game = new Keima({ width: 3, height: 3, komi: 0.5 });

  expect(game.nextToPlay()).toEqual([0]);
  game.playMove(0, "aa");
  expect(game.nextToPlay()).toEqual([0]);
  expect(() => game.playMove(1, "bb")).toThrow("It's not player 1's turn!");
});

test("Play a game - non keima move throws", () => {
  const game = new Keima({ width: 3, height: 3, komi: 0.5 });

  game.playMove(0, "aa");
  expect(() => game.playMove(0, "bb")).toThrow("Knight's move");
});

test("Play a game", () => {
  const game = new Keima({ width: 4, height: 4, komi: 0.5 });
  // Tiny board:
  // - W - -
  // - - B -
  // B - W -
  // - - - -
  expect(game.nextToPlay()).toEqual([0]);
  game.playMove(0, "ac");
  expect(game.nextToPlay()).toEqual([0]);
  game.playMove(0, "cb");
  expect(game.nextToPlay()).toEqual([1]);
  game.playMove(1, "cc");
  expect(game.nextToPlay()).toEqual([1]);
  game.playMove(1, "ba");

  expect(game.exportState().board).toEqual([
    [_, W, _, _],
    [_, _, B, _],
    [B, _, W, _],
    [_, _, _, _],
  ]);
});

test("No possible follow-up moves throws", () => {
  const game = new Keima({ width: 4, height: 4, komi: 0.5 });

  game.playMove(0, "ac");
  game.playMove(0, "cb");
  game.playMove(1, "pass");
  game.playMove(0, "cc");
  game.playMove(0, "ab");
  game.playMove(1, "pass");
  game.playMove(0, "bb");
  game.playMove(0, "da");
  game.playMove(1, "pass");
  game.playMove(0, "bd");
  game.playMove(0, "dc");

  expect(game.exportState().board).toEqual([
    [_, _, _, B],
    [B, B, B, _],
    [B, _, B, B],
    [_, B, _, _],
  ]);

  expect(() => game.playMove(1, "dd")).toThrow();
});
