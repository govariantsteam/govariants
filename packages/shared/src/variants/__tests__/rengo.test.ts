import { BadukState, Color } from "../baduk";
import { Rengo } from "../rengo";

const B = Color.BLACK;
const _ = Color.EMPTY;
const W = Color.WHITE;

test("rengo + baduk", () => {
  const game = new Rengo<BadukState>({
    subVariant: "baduk",
    subVariantConfig: {
      komi: 6.5,
      board: {
        type: "grid",
        width: 3,
        height: 3,
      },
    },
    teamSizes: [2, 2],
  });

  game.playMove(0, "bb");
  game.playMove(2, "bc");
  game.playMove(1, "cb");
  game.playMove(3, "ab");
  game.playMove(0, "ba");
  game.playMove(2, "pass");
  game.playMove(1, "aa");
  game.playMove(3, "pass");
  game.playMove(0, "ac");

  expect(game.numPlayers()).toEqual(4);
  expect(game.round).toEqual(9);
  expect(game.nextToPlay()).toEqual([2]);
  expect(game.exportState().board).toEqual([
    [B, B, _],
    [_, B, B],
    [B, W, _],
  ]);

  game.playMove(2, "pass");
  game.playMove(1, "pass");

  expect(game.phase).toEqual("gameover");
  expect(game.exportState().score_board).toEqual([
    [B, B, B],
    [B, B, B],
    [B, W, _],
  ]);
  expect(game.result).toEqual("W+0.5");
});
