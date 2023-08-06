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
  expect(game.exportState().board).toEqual([
    [_, W, W, _],
    [_, W, W, _],
  ]);

  game.playMove(0, "pass");
  game.playMove(1, "pass");

  expect(game.phase).toBe("gameover");
  expect(game.exportState().score_board).toEqual([
    [W, W, B, B],
    [W, W, B, B],
  ]);
});
