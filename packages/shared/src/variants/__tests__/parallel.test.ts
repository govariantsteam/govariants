import { ParallelGo } from "../parallel";

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
    last_round: {},
  });
  expect(game.exportState(0).staged).toEqual({ 0: "ba" });
  expect(game.exportState(1).staged).toEqual({ 1: "ca" });
  expect(Object.keys(game.exportState(2).staged)).toEqual([]);
  expect(Object.keys(game.exportState(3).staged)).toEqual([]);
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
    last_round: { 0: "ba", 1: "ca", 2: "bb", 3: "cb" },
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

test("Ko stone disappears after one round", () => {
  const game = new ParallelGo({
    width: 2,
    height: 2,
    num_players: 2,
    collision_handling: "ko",
  });
  game.playMove({ 0: "aa" });
  game.playMove({ 1: "aa" });
  game.playMove({ 0: "ba" });
  game.playMove({ 1: "ab" });

  expect(game.exportState().board[0][0]).toEqual([]);
});

test("Ko stone still exists midround", () => {
  const game = new ParallelGo({
    width: 2,
    height: 2,
    num_players: 2,
    collision_handling: "ko",
  });
  game.playMove({ 0: "aa" });
  game.playMove({ 1: "aa" });
  game.playMove({ 0: "bb" });

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

test("Double suicide", () => {
  const game = new ParallelGo({
    width: 2,
    height: 2,
    num_players: 2,
    collision_handling: "ko",
  });
  game.playMove({ 0: "aa" });
  game.playMove({ 1: "ab" });
  game.playMove({ 0: "ba" });
  game.playMove({ 1: "bb" });

  expect(game.exportState().board).toEqual([
    [[], []],
    [[], []],
  ]);
});

test("Kill already placed groups first", () => {
  const game = new ParallelGo({
    width: 4,
    height: 1,
    num_players: 2,
    collision_handling: "ko",
  });
  game.playMove({ 0: "aa" });
  game.playMove({ 1: "da" });
  game.playMove({ 0: "ca" });
  game.playMove({ 1: "ba" });

  expect(game.exportState().board).toEqual([[[], [1], [0], []]]);
});

test("Merge kill", () => {
  const game = new ParallelGo({
    width: 4,
    height: 1,
    num_players: 2,
    collision_handling: "merge",
  });
  game.playMove({ 0: "aa" });
  game.playMove({ 1: "ca" });
  game.playMove({ 0: "ba" });
  game.playMove({ 1: "ba" });

  expect(game.exportState().board).toEqual([[[], [], [1], []]]);
});

test("Double capture by the wall", () => {
  const game = new ParallelGo({
    width: 6,
    height: 5,
    num_players: 2,
    collision_handling: "merge",
  });
  const moves: Array<{ 0: string } | { 1: string }> = [
    {
      "0": "cd",
    },
    {
      "1": "dd",
    },
    {
      "0": "dc",
    },
    {
      "1": "cc",
    },
    {
      "0": "ed",
    },
    {
      "1": "bd",
    },
    {
      "0": "de",
    },
    {
      "1": "ce",
    },
  ];
  moves.forEach((move) => game.playMove(move));

  expect(game.exportState().board).toEqual([
    [[], [], [], [], [], []],
    [[], [], [], [], [], []],
    [[], [], [1], [0], [], []],
    [[], [1], [], [], [0], []],
    [[], [], [1], [0], [], []],
  ]);
});
