import { SuperTicTacGo } from "../super_tic_tac_go";
import { Color } from "../baduk";

const B = Color.BLACK,
  _ = Color.EMPTY,
  W = Color.WHITE;

test("Play a game", () => {
  const game = new SuperTicTacGo({ width: 9, height: 9, komi: 0 });
  expect(game.nextToPlay()).toEqual([0]);

  game.playMove(0, "aa");
  expect(game.nextToPlay()).toEqual([1]);
  expect(() => game.playMove(1, "ee")).toThrow();
  game.playMove(1, "bb");
  expect(game.nextToPlay()).toEqual([0]);
  game.playMove(0, "ee");

  expect(game.exportState().board).toEqual([
    [B, _, _, _, _, _, _, _, _],
    [_, W, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _],

    [_, _, _, _, _, _, _, _, _],
    [_, _, _, _, B, _, _, _, _],
    [_, _, _, _, _, _, _, _, _],

    [_, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _],
    [_, _, _, _, _, _, _, _, _],
  ]);
});
