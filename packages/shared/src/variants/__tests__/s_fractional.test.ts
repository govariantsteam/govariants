import { SFractional } from "../s_fractional";

// These variables just make the boards a little prettier
const B = 0;
const _ = null;
const W = 1;

test("Play a game", () => {
  const game = new SFractional({
    komi: 0,
    board: {
      type: "grid",
      width: 4,
      height: 4,
    },
    secondary_colors: ["red", "green"],
  });

  game.playMove(0, "aa");
  game.playMove(1, "bb");
  game.playMove(0, "ab");
  game.playMove(1, "ba");

  //  [(B, R), (B, G), _, _],
  //  [(W, G), (W, R), _, _],
  //  [______, ______, _, _],
  //  [______, ______, _, _],

  const state = game.exportState();

  console.log(JSON.stringify(state.stonePlacements));

  expect(state.lastMove).toEqual("ba");

  expect(state.stonePlacements).toEqual([
    [{ x: 1, y: 0 }, ["white", "green"]],
    [{ x: 0, y: 1 }, ["black", "green"]],
    [{ x: 1, y: 1 }, ["white", "red"]],
  ]);
});
