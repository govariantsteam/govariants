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
  game.playMove(0, "ba");
  game.playMove(1, "ab");

  //  [(B,R) (B,G) _ _],
  //  [(W,G) (W,R) _ _],
  //  [_____ _____ _ _],
  //  [_____ _____ _ _],

  const state = game.exportState();

  expect(state.lastMove).toEqual("ab");

  expect(state.board).toEqual([
    [[], ["black", "green"], [], []],
    [["white", "green"], ["white", "red"], [], []],
    [[], [], [], []],
    [[], [], [], []],
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

test("territory test", () => {
  const game = new SFractional({
    komi: 0.5,
    board: {
      type: "grid",
      width: 4,
      height: 4,
    },
    secondary_colors: ["red", "green"],
  });

  game.playMove(0, "ba");
  game.playMove(1, "ca");
  game.playMove(0, "bb");
  game.playMove(1, "cb");
  game.playMove(0, "bc");
  game.playMove(1, "cc");
  game.playMove(0, "bd");
  game.playMove(1, "dc");
  game.playMove(0, "pass");
  game.playMove(1, "pass");

  //  [_ (B,R) (W,R) _____],
  //  [_ (B,G) (W,G) _____],
  //  [_ (B,R) (W,R) (W,G)],
  //  [_ (B,G) _____ _____],

  const state = game.exportState();

  expect(game.phase).toBe("gameover");
  expect(game.result).toBe("B+1.5");

  expect(state.scoreBoard).toEqual([
    ["black", "", "", "white"],
    ["black", "", "", "white"],
    ["black", "", "", ""],
    ["black", "", "", ""],
  ]);
});
