import { SFractional } from "../s_fractional";

test("grid board test", () => {
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

test("graph board test", () => {
  const game = new SFractional({
    komi: 0,
    board: {
      type: "gridWithHoles",
      bitmap: [
        [3, 3, 3, 3, 2],
        [3, 3, 1, 3, 2],
        [3, 2, 0, 3, 2],
        [3, 3, 3, 3, 2],
        [1, 1, 1, 1, 4],
      ],
    },
    secondary_colors: ["red", "green"],
  });

  //  [_ _ _ _ _],
  //  [_ _ _ _ _],
  //  [_ _ # _ _],
  //  [_ _ _ _ _],
  //  [_ _ _ _ _],

  expect(() => game.playMove(0, "cc")).toThrow();
});
