import { Baduk, Color } from "../baduk";
import { mapToNewConfig } from "../baduk_utils";
import { KoError } from "../../lib/ko_detector";

const B = Color.BLACK;
const _ = Color.EMPTY;
const W = Color.WHITE;

test("Play a game", () => {
  const game = new Baduk({ width: 4, height: 2, komi: 0.5 });
  // Tiny board:
  // - W B -
  // - W B -
  expect(game.nextToPlay()).toEqual([0]);
  game.playMove(0, "ca");
  expect(game.nextToPlay()).toEqual([1]);
  game.playMove(1, "ba");
  expect(game.nextToPlay()).toEqual([0]);
  game.playMove(0, "cb");
  expect(game.nextToPlay()).toEqual([1]);
  game.playMove(1, "bb");
  expect(game.nextToPlay()).toEqual([0]);

  // check that the final state is as expected
  expect(game.exportState().board).toEqual([
    [_, W, B, _],
    [_, W, B, _],
  ]);

  expect(game.phase).toBe("play");
  game.playMove(0, "pass");
  expect(game.phase).toBe("play");
  game.playMove(1, "pass");

  expect(game.phase).toBe("gameover");
  expect(game.result).toBe("W+0.5");
  expect(game.exportState().score_board).toEqual([
    [W, W, B, B],
    [W, W, B, B],
  ]);
});

test("Play a game with captures", () => {
  const game = new Baduk({ width: 2, height: 2, komi: 0.5 });
  // Tiny board
  // B W
  // B .
  game.playMove(0, "aa");
  game.playMove(1, "ba");
  game.playMove(0, "ab");
  expect(game.exportState().board).toEqual([
    [B, W],
    [B, _],
  ]);

  // Tiny board
  // . W
  // . W
  game.playMove(1, "bb");
  expect(game.exportState().board).toEqual([
    [_, W],
    [_, W],
  ]);

  expect(game.phase).toBe("play");
  game.playMove(0, "pass");
  expect(game.phase).toBe("play");
  game.playMove(1, "pass");
  expect(game.phase).toBe("gameover");
  expect(game.result).toBe("W+4.5");
  expect(game.exportState().score_board).toEqual([
    [W, W],
    [W, W],
  ]);
});

test("Resign a game", () => {
  const game = new Baduk({ width: 19, height: 19, komi: 5.5 });
  game.playMove(0, "resign");
  expect(game.phase).toBe("gameover");
  expect(game.result).toBe("W+R");
});

test("Scoring with open borders", () => {
  const game = new Baduk({ width: 5, height: 5, komi: 6.5 });
  game.playMove(0, "cb");
  game.playMove(1, "cc");
  game.playMove(0, "pass");
  game.playMove(1, "pass");

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

  game.playMove(0, "ba");
  game.playMove(1, "ca");
  game.playMove(0, "ab");
  game.playMove(1, "db");
  game.playMove(0, "bc");
  game.playMove(1, "cc");
  game.playMove(0, "cb");

  // White captures
  game.playMove(1, "bb");

  // Black captures back
  expect(() => game.playMove(0, "cb")).toThrow(KoError);
});

test("inner group score", () => {
  const game = new Baduk({ width: 9, height: 9, komi: 0 });

  const rounds = [
    ["cc", "cb"],
    ["dc", "db"],
    ["ec", "eb"],
    ["fc", "fb"],
    ["gc", "gb"],
    ["gd", "hc"],
    ["ge", "hd"],
    ["gf", "he"],
    ["gg", "hf"],
    ["fg", "hg"],
    ["eg", "gh"],
    ["dg", "fh"],
    ["cg", "eh"],
    ["cd", "dh"],
    ["cf", "ch"],
    ["ce", "bg"],
    ["pass", "bf"],
    ["pass", "be"],
    ["pass", "bd"],
    ["pass", "bc"],
    ["pass", "pass"],
  ];

  rounds.forEach((round) => {
    game.playMove(0, round[0]);
    game.playMove(1, round[1]);
  });

  // . . . . . . . . .
  // . . W W W W W . .
  // . W B B B B B W .
  // . W B . . . B W .
  // . W B . . . B W .
  // . W B . . . B W .
  // . W B B B B B W .
  // . . W W W W W . .
  // . . . . . . . . .

  expect(game.result).toBe("W+31"); // 56 - 25
  expect(game.exportState().score_board).toEqual([
    [W, W, W, W, W, W, W, W, W],
    [W, W, W, W, W, W, W, W, W],
    [W, W, B, B, B, B, B, W, W],
    [W, W, B, B, B, B, B, W, W],
    [W, W, B, B, B, B, B, W, W],
    [W, W, B, B, B, B, B, W, W],
    [W, W, B, B, B, B, B, W, W],
    [W, W, W, W, W, W, W, W, W],
    [W, W, W, W, W, W, W, W, W],
  ]);
});

test("Capture test", () => {
  const game = new Baduk({ width: 3, height: 3, komi: 6.5 });

  const rounds = [
    ["aa", "ba"],
    ["ab", "bc"],
    ["cb", "bb"],
    ["ca", "cc"],
    ["cb", "ac"],
    ["pass", "pass"],
  ];

  rounds.forEach((round) => {
    game.playMove(0, round[0]);
    game.playMove(1, round[1]);
  });

  expect(game.exportState().board).toEqual([
    [_, W, _],
    [_, W, B],
    [W, W, W],
  ]);
});

test("Board too big", () => {
  // SGF encoding only supports up to 52
  expect(() => new Baduk({ width: 500, height: 500, komi: 0 })).toThrow();
});

test("mapToNewConfig preserves extra fields", () => {
  const legacyConfig = {
    extra: "data",
    width: 2,
    height: 3,
    komi: 5.5,
  };
  const newConfig = mapToNewConfig(legacyConfig);
  expect(newConfig.extra).toEqual("data");
});
