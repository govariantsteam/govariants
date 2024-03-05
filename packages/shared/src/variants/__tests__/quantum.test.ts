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
