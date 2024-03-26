import { QuantumGo } from "../quantum";
import { Color } from "../baduk";

const W = Color.WHITE;
const B = Color.BLACK;
const _ = Color.EMPTY;

test("Quantum stone placement", () => {
  const game = new QuantumGo({ width: 2, height: 2, komi: 0.5 });

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
  expect(game.exportState().quantum_stones).toEqual([
    ["aa", null],
    [null, "aa"],
  ]);

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
  expect(game.exportState().quantum_stones).toEqual([
    ["aa", "bb"],
    ["bb", "aa"],
  ]);
});

test("Test throws if incorrect player in the quantum stone phase", () => {
  const game = new QuantumGo({ width: 2, height: 2, komi: 0.5 });

  expect(() => game.playMove(1, "aa")).toThrow();
  game.playMove(0, "aa");
  expect(() => game.playMove(0, "bb")).toThrow();
});

test("Test throws stone played on top of stone in quantum phase", () => {
  const game = new QuantumGo({ width: 2, height: 2, komi: 0.5 });

  game.playMove(0, "aa");
  expect(() => game.playMove(1, "aa")).toThrow();
});

test("Capture quantum stone", () => {
  const game = new QuantumGo({ width: 5, height: 3, komi: 0.5 });

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
  expect(game.exportState().quantum_stones).toEqual([
    ["ba", "bb"],
    ["bb", "ba"],
  ]);

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
  expect(game.exportState().quantum_stones).toEqual([["ba", "bb"]]);
});

test("Capture non-quantum stone", () => {
  const game = new QuantumGo({ width: 5, height: 3, komi: 0.5 });

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
  expect(game.exportState().quantum_stones).toEqual([
    ["ba", "eb"],
    ["eb", "ba"],
  ]);

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
  expect(game.exportState().quantum_stones).toEqual([
    ["ba", "eb"],
    ["eb", "ba"],
  ]);
});

test("Two passes ends the game", () => {
  const game = new QuantumGo({ width: 4, height: 2, komi: 0.5 });

  game.playMove(0, "ba");
  game.playMove(1, "ca");
  game.playMove(0, "bb");
  game.playMove(1, "cb");

  // . {B}{W} .     . {W} {B} .
  // .  B  W  .     .  B   W  .

  game.playMove(0, "pass");
  game.playMove(1, "pass");

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