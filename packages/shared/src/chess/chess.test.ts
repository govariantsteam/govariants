import { Chess } from "./chess";

// A 3-letter placeholder helps with board alignment
const ___ = null;

test("Knight can move", () => {
  const game = new Chess({});

  game.playMove({ 0: "e4" });
  game.playMove({ 1: "e5" });
  game.playMove({ 0: "Nf3" });

  expect(game.exportState().board).toEqual([
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", ___, "p", "p", "p"],
    [___, ___, ___, ___, ___, ___, ___, ___],
    [___, ___, ___, ___, "p", ___, ___, ___],
    [___, ___, ___, ___, "P", ___, ___, ___],
    [___, ___, ___, ___, ___, "N", ___, ___],
    ["P", "P", "P", "P", ___, "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", ___, "R"],
  ]);
});

test("Bishop can move", () => {
  const game = new Chess({});

  game.playMove({ 0: "e4" });
  game.playMove({ 1: "e5" });
  game.playMove({ 0: "Bc4" });

  expect(game.exportState().board).toEqual([
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", ___, "p", "p", "p"],
    [___, ___, ___, ___, ___, ___, ___, ___],
    [___, ___, ___, ___, "p", ___, ___, ___],
    [___, ___, "B", ___, "P", ___, ___, ___],
    [___, ___, ___, ___, ___, ___, ___, ___],
    ["P", "P", "P", "P", ___, "P", "P", "P"],
    ["R", "N", "B", "Q", "K", ___, "N", "R"],
  ]);
});

test("King's side castle", () => {
  const game = new Chess({});

  game.playMove({ 0: "e4" });
  game.playMove({ 1: "e5" });
  game.playMove({ 0: "Nf3" });
  game.playMove({ 1: "Nc6" });
  game.playMove({ 0: "Bc4" });
  game.playMove({ 1: "d6" });
  game.playMove({ 0: "0-0" });

  expect(game.exportState().castling_rights).toBe("K");

  // Capture the d5 pawn by en passant
  game.playMove({ 0: "exd6" });

  expect(game.exportState().board).toEqual([
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", ___, "p", "p", "p"],
    [___, ___, ___, ___, ___, ___, ___, ___],
    [___, ___, ___, ___, "p", ___, ___, ___],
    [___, ___, "B", ___, "P", ___, ___, ___],
    [___, ___, ___, ___, ___, "N", ___, ___],
    ["P", "P", "P", "P", ___, "P", "P", "P"],
    ["R", "N", "B", "Q", ___, "R", "K", ___],
  ]);
});

test("En Passant", () => {
  const game = new Chess({});

  game.playMove({ 0: "e4" });
  game.playMove({ 1: "e6" });
  game.playMove({ 0: "e5" });
  game.playMove({ 1: "d5" });

  expect(game.exportState().en_passant_target).toBe("d6");

  // Capture the d5 pawn by en passant
  game.playMove({ 0: "exd6" });

  expect(game.exportState().board).toEqual([
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", ___, ___, "p", "p", "p"],
    [___, ___, ___, "P", "p", ___, ___, ___],
    [___, ___, ___, ___, ___, ___, ___, ___],
    [___, ___, ___, ___, ___, ___, ___, ___],
    [___, ___, ___, ___, ___, ___, ___, ___],
    ["P", "P", "P", "P", ___, "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"],
  ]);
});
