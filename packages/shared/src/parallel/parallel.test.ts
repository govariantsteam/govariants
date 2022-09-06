import { ParallelGo } from "./parallel";

test("Halfway through the round, moves are staged, but not placed.", () => {
  const game = new ParallelGo({
    width: 4,
    height: 2,
    num_players: 4,
    collision_handling: "pass",
  });
  game.playMove({ 0: "ba" });
  game.playMove({ 1: "ca" });

  expect(game.exportState()).toEqual({
    board: [
      [[], [], [], []],
      [[], [], [], []],
    ],
    staged: { 0: "ba", 1: "ca" },
  });
});

test("After one round, stones are placed, and no stones are staged.", () => {
  const game = new ParallelGo({
    width: 4,
    height: 2,
    num_players: 4,
    collision_handling: "pass",
  });
  game.playMove({ 0: "ba" });
  game.playMove({ 1: "ca" });
  game.playMove({ 2: "bb" });
  game.playMove({ 3: "cb" });

  expect(game.exportState()).toEqual({
    board: [
      [[], [0], [1], []],
      [[], [2], [3], []],
    ],
    staged: {},
  });
});

test("If all players pass, the game is ended.", () => {
  const game = new ParallelGo({
    width: 2,
    height: 2,
    num_players: 4,
    collision_handling: "pass",
  });
  game.playMove({ 0: "pass" });
  game.playMove({ 1: "pass" });
  game.playMove({ 2: "pass" });
  game.playMove({ 3: "pass" });

  expect(game.phase).toBe("gameover");
});

test("Collision places no stones. (pass mode)", () => {
  const game = new ParallelGo({
    width: 2,
    height: 2,
    num_players: 2,
    collision_handling: "pass",
  });
  game.playMove({ 0: "aa" });
  game.playMove({ 1: "aa" });

  expect(game.exportState().board).toEqual([
    [[], []],
    [[], []],
  ]);
});

test("Collision places Ko Stone. (ko mode)", () => {
  const game = new ParallelGo({
    width: 2,
    height: 2,
    num_players: 2,
    collision_handling: "ko",
  });
  game.playMove({ 0: "aa" });
  game.playMove({ 1: "aa" });

  expect(game.exportState().board).toEqual([
    [[-1], []],
    [[], []],
  ]);
});

test("Collision places merged stone. (merge mode)", () => {
  const game = new ParallelGo({
    width: 2,
    height: 2,
    num_players: 2,
    collision_handling: "merge",
  });
  game.playMove({ 0: "aa" });
  game.playMove({ 1: "aa" });

  expect(game.exportState().board).toEqual([
    [[0, 1], []],
    [[], []],
  ]);
});
