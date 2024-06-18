import { QuantumGo } from "../quantum";
import { Color } from "../baduk";
import { Grid } from "../../lib/grid";

const W = Color.WHITE;
const B = Color.BLACK;
const _ = Color.EMPTY;

test("Quantum stone placement", () => {
  const game = new QuantumGo({
    board: { type: "grid", width: 2, height: 2 },
    komi: 0.5,
  });

  game.playMove(0, "aa");
  expect(game.exportState().boards).toEqual([
    [
      [B, _],
      [_, _],
    ],
    [
      [W, _],
      [_, _],
    ],
  ]);
  expect(game.exportState().quantum_stones).toEqual(["aa"]);

  game.playMove(1, "bb");
  expect(game.exportState().boards).toEqual([
    [
      [B, _],
      [_, W],
    ],
    [
      [W, _],
      [_, B],
    ],
  ]);
  expect(game.exportState().quantum_stones).toEqual(["aa", "bb"]);
});

test("Test throws if incorrect player in the quantum stone phase", () => {
  const game = new QuantumGo({
    board: { type: "grid", width: 2, height: 2 },
    komi: 0.5,
  });

  expect(() => game.playMove(1, "aa")).toThrow();
  game.playMove(0, "aa");
  expect(() => game.playMove(0, "bb")).toThrow();
});

test("Test throws stone played on top of stone in quantum phase", () => {
  const game = new QuantumGo({
    board: { type: "grid", width: 2, height: 2 },
    komi: 0.5,
  });

  game.playMove(0, "aa");
  expect(() => game.playMove(1, "aa")).toThrow();
});

test("Capture quantum stone", () => {
  const game = new QuantumGo({
    board: { type: "grid", width: 5, height: 3 },
    komi: 0.5,
  });

  // .{B}. . W
  // B{W}B . W
  // . . . . .

  (
    [
      [0, "ba"],
      [1, "bb"],
      [0, "ab"],
      [1, "ea"],
      [0, "cb"],
      [1, "eb"],
    ] as const
  ).forEach((move) => game.playMove(move[0], move[1]));

  expect(game.exportState().boards).toEqual([
    [
      [_, B, _, _, W],
      [B, W, B, _, W],
      [_, _, _, _, _],
    ],
    [
      [_, W, _, _, W],
      [B, B, B, _, W],
      [_, _, _, _, _],
    ],
  ]);
  expect(game.exportState().quantum_stones).toEqual(["ba", "bb"]);

  // Capture the 1-1 stone
  // And the 2-1 quantum stone at board 2 also dies
  game.playMove(0, "bc");
  expect(game.exportState().boards).toEqual([
    [
      [_, B, _, _, W],
      [B, _, B, _, W],
      [_, B, _, _, _],
    ],
    [
      [_, _, _, _, W],
      [B, B, B, _, W],
      [_, B, _, _, _],
    ],
  ]);
  expect(game.exportState().quantum_stones).toEqual(["ba", "bb"]);
});

test("Capture non-quantum stone", () => {
  const game = new QuantumGo({
    board: { type: "grid", width: 5, height: 3 },
    komi: 0.5,
  });

  // .{B}. . W
  // B W B .{W}
  // . . . . .

  (
    [
      [0, "ba"],
      [1, "eb"],
      [0, "ab"],
      [1, "ea"],
      [0, "cb"],
      [1, "bb"],
    ] as const
  ).forEach((move) => game.playMove(move[0], move[1]));

  expect(game.exportState().boards).toEqual([
    [
      [_, B, _, _, W],
      [B, W, B, _, W],
      [_, _, _, _, _],
    ],
    [
      [_, W, _, _, W],
      [B, W, B, _, B],
      [_, _, _, _, _],
    ],
  ]);
  expect(game.exportState().quantum_stones).toEqual(["ba", "eb"]);

  // Capture the 1-1 stone
  // And the 1-1  stone at board 2 also dies
  game.playMove(0, "bc");
  expect(game.exportState().boards).toEqual([
    [
      [_, B, _, _, W],
      [B, _, B, _, W],
      [_, B, _, _, _],
    ],
    [
      [_, W, _, _, W],
      [B, _, B, _, B],
      [_, B, _, _, _],
    ],
  ]);
  expect(game.exportState().quantum_stones).toEqual(["ba", "eb"]);
});

test("Two passes ends the game", () => {
  const game = new QuantumGo({
    board: { type: "grid", width: 4, height: 2 },
    komi: 0.5,
  });

  game.playMove(0, "ba");
  game.playMove(1, "ca");
  game.playMove(0, "bb");
  game.playMove(1, "cb");

  // . {B}{W} .     . {W} {B} .
  // .  B  W  .     .  B   W  .

  game.playMove(0, "pass");
  game.playMove(1, "pass");

  expect(game.getSGF()).toBe(
    "(;\nEV[GO Variants]\nPB[player Black]\nPW[player white]\nSZ[4:2]\nKM[6.5]\nVS[quantum]\n\n\n;B[ba];W[ca];B[bb];W[cb]\n\n)",
  );

  // next to play should be empty in order for time control to work
  expect(game.nextToPlay()).toEqual([]);
  // Board is symmetrical, so White wins by komi
  expect(game.result).toBe("W+0.5");
  const state = game.exportState();
  // TODO: add visual indicator of scored area
  // expect(state.score_boards).toBe([
  //   [
  //     [B, B, W, W],
  //     [B, B, W, W],
  //   ],
  //   [
  //     // No borders weren't filled, so only stones count
  //     [_, W, B, _],
  //     [_, B, W, _],
  //   ],
  // ]);
  expect(state.boards).toEqual([
    [
      [_, B, W, _],
      [_, B, W, _],
    ],
    [
      [_, W, B, _],
      [_, B, W, _],
    ],
  ]);
});

test("Placing a stone in a captured quantum position", () => {
  const game = new QuantumGo({
    board: { type: "grid", width: 9, height: 9 },
    komi: 0.5,
  });

  // https://www.govariants.com/game/660248dd5e01aefcbd63df6a

  //  W . . . . . W .{.}
  //  B . . . . . . W .
  //  B . . . . . . . W
  //  B . . . . . . . .
  //  . . . . W . . . .
  //  . . . . . . . . .
  //  . . . . . . . . .
  //  . . . . . . . . .
  // {.}. . . . . . . .

  const moves = [
    [0, "ia"],
    [1, "ai"],
    [0, "ha"],
    [1, "ee"],
    [0, "ib"],
    [1, "aa"],
    [0, "ab"],
    [1, "ga"],
    [0, "ac"],
    [1, "hb"],
    [0, "ad"],
    [1, "ic"],
    [0, "ia"], // black stone in the corner
  ] as const;

  moves.forEach((move) => game.playMove(move[0], move[1]));

  const boards = game.exportState().boards.map(Grid.from2DArray);
  expect(boards[0].at({ x: 8, y: 0 })).toBe(Color.BLACK);
  expect(boards[0].at({ x: 0, y: 8 })).toBe(Color.EMPTY);
  expect(boards[1].at({ x: 8, y: 0 })).toBe(Color.EMPTY);
  // Quantum stones live together
  expect(boards[1].at({ x: 0, y: 8 })).toBe(Color.BLACK);

  expect(game.exportState().quantum_stones).toEqual(["ia", "ai"]);
});

test("Placing a white stone in a captured quantum position", () => {
  const game = new QuantumGo({
    board: { type: "grid", width: 9, height: 9 },
    komi: 0.5,
  });

  // https://www.govariants.com/game/660248dd5e01aefcbd63df6a

  //  W . . . . . W .{.}
  //  B . . . . . . W .
  //  B . . . . . . . W
  //  B . . . . . . . .
  //  . . . . W . . . .
  //  . . . . . . . . .
  //  . . . . . . . . .
  //  . . . . . . . . .
  // {.}. . . . . . . .

  const moves = [
    [0, "ia"],
    [1, "ai"],
    [0, "ha"],
    [1, "ee"],
    [0, "ib"],
    [1, "aa"],
    [0, "ab"],
    [1, "ga"],
    [0, "ac"],
    [1, "hb"],
    [0, "ad"],
    [1, "ic"],
    [0, "ii"],
    [1, "ia"], // white stone in the corner
  ] as const;

  moves.forEach((move) => game.playMove(move[0], move[1]));

  const boards = game.exportState().boards.map(Grid.from2DArray);
  expect(boards[0].at({ x: 8, y: 0 })).toBe(Color.EMPTY);
  expect(boards[0].at({ x: 0, y: 8 })).toBe(Color.WHITE);
  expect(boards[1].at({ x: 8, y: 0 })).toBe(Color.WHITE);
  expect(boards[1].at({ x: 0, y: 8 })).toBe(Color.EMPTY);

  expect(game.exportState().quantum_stones).toEqual(["ia", "ai"]);
});
