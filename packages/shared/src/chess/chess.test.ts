import { ChessGame } from "./chess";

// A 3-letter placeholder helps with board alignment
const ___ = null;

test("Knight can move", () => {
  const game = new ChessGame();

  game.playMove({ 0: "e4" });
  game.playMove({ 1: "e5" });
  game.playMove({ 0: "Nf3" });

  expect(game.exportState().fen).toBe(
    "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2"
  );
});

test("Bishop can move", () => {
  const game = new ChessGame();

  game.playMove({ 0: "e4" });
  game.playMove({ 1: "e5" });
  game.playMove({ 0: "Bc4" });

  expect(game.exportState().fen).toEqual(
    "rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq - 1 2"
  );
});

test("King's side castle", () => {
  const game = new ChessGame();

  game.playMove({ 0: "e4" });
  game.playMove({ 1: "e5" });
  game.playMove({ 0: "Nf3" });
  game.playMove({ 1: "Nc6" });
  game.playMove({ 0: "Bc4" });
  game.playMove({ 1: "d6" });
  game.playMove({ 0: "O-O" });

  expect(game.exportState().fen).toEqual(
    "r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 1 4"
  );
});

test("En Passant", () => {
  const game = new ChessGame();

  game.playMove({ 0: "e4" });
  game.playMove({ 1: "e6" });
  game.playMove({ 0: "e5" });
  game.playMove({ 1: "d5" });

  // en passant target is set to d6
  expect(game.exportState().fen).toBe(
    "rnbqkbnr/ppp2ppp/4p3/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3"
  );

  // Capture the d5 pawn by en passant
  game.playMove({ 0: "exd6" });

  expect(game.exportState().fen).toEqual(
    "rnbqkbnr/ppp2ppp/3Pp3/8/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 3"
  );
});
