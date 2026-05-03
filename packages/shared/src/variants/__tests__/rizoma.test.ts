import { Rizoma } from "../rizoma";

const B = 0;
const _ = null;
const W = 1;

const twoBoard4x4 = {
  boards: [
    { width: 4, height: 4, komi: 0 },
    { width: 4, height: 4, komi: 0 },
  ],
  global_komi: 0,
};

test("Play a game on board 0", () => {
  const game = new Rizoma(twoBoard4x4);
  // Board 0:        Board 1:
  // B - - -         (empty)
  // - W - -
  // - - B -
  // - - - W
  game.playMove(0, "0:aa");
  game.playMove(1, "0:bb");
  game.playMove(0, "0:cc");
  game.playMove(1, "0:dd");

  expect(game.exportState().boards[0]).toEqual([
    [B, _, _, _],
    [_, W, _, _],
    [_, _, B, _],
    [_, _, _, W],
  ]);
});

test("Transfer mechanic: capture grants bonus move on other board", () => {
  const game = new Rizoma(twoBoard4x4);
  // Surround a white stone on board 0, then redeploy on board 1.
  // Board 0: place W at (1,1), surround with B on all 4 sides.
  // W is at column 1 row 1 (b,b in sgf). Neighbors: (1,0),(1,2),(0,1),(2,1).
  game.playMove(0, "0:ba"); // B at (1,0)
  game.playMove(1, "0:bb"); // W at (1,1)
  game.playMove(0, "0:ab"); // B at (0,1)
  game.playMove(1, "1:aa"); // W plays elsewhere
  game.playMove(0, "0:cb"); // B at (2,1)
  game.playMove(1, "1:bb"); // W plays elsewhere
  game.playMove(0, "0:bc"); // B at (1,2) — W at (1,1) has no liberties, captured

  const state = game.exportState();
  expect(state.boards[0][1][1]).toBe(_); // W stone removed
  expect(state.pending_transfers).toBe(1);
  expect(state.transfer_source_board).toBe(0);

  // Player 0 plays transfer move on board 1
  game.playMove(0, "1:cc");
  const state2 = game.exportState();
  expect(state2.pending_transfers).toBe(0);
  expect(state2.boards[1][2][2]).toBe(B);
});

test("Ko rule: ko_forbidden_player is set on single-stone capture", () => {
  const game = new Rizoma(twoBoard4x4);
  // Same setup as transfer test: B captures W at (1,1) on board 0.
  game.playMove(0, "0:ba"); // B (1,0)
  game.playMove(1, "0:bb"); // W (1,1)
  game.playMove(0, "0:ab"); // B (0,1)
  game.playMove(1, "1:aa"); // W elsewhere
  game.playMove(0, "0:cb"); // B (2,1)
  game.playMove(1, "1:bb"); // W elsewhere
  game.playMove(0, "0:bc"); // B (1,2) — captures W at (1,1), single stone → ko set

  const state = game.exportState();
  expect(state.ko_board).toBe(0);
  expect(state.ko_forbidden_player).toBe(W); // W cannot immediately recapture
  expect(state.ko_point[0]).toEqual({ x: 1, y: 1 });
});

test("Ko rule: recapture is rejected while ko is active", () => {
  const game = new Rizoma(twoBoard4x4);
  // Capture W at (1,1) on board 0.
  game.playMove(0, "0:ba");
  game.playMove(1, "0:bb");
  game.playMove(0, "0:ab");
  game.playMove(1, "1:aa");
  game.playMove(0, "0:cb");
  game.playMove(1, "1:bb");
  game.playMove(0, "0:bc"); // captures W at (1,1) → ko at (1,1), W forbidden

  // Player 0 must play a transfer move (has 1 pending). Play on board 1.
  game.playMove(0, "1:cc");

  // Now it's W's turn. W tries to recapture at (1,1) on board 0.
  expect(() => game.playMove(1, "0:bb")).toThrow("Ko rule violation");
});

test("Keep prisoners does not count toward double-pass game end", () => {
  const game = new Rizoma(twoBoard4x4);
  // Create a situation where player 0 can keep prisoners.
  // Capture W at (0,0): surround with B at (1,0) and (0,1).
  game.playMove(0, "0:ba"); // B (1,0)
  game.playMove(1, "0:aa"); // W (0,0)
  game.playMove(0, "0:ab"); // B (0,1) — W at (0,0) has no liberties, captured

  // Player 0 should have 1 pending transfer.
  expect(game.exportState().pending_transfers).toBe(1);

  // Player 0 keeps prisoners via the dedicated move.
  game.playMove(0, "keep_prisoners");

  // Game must NOT be over — keep_prisoners is not a game-ending pass.
  expect(game.phase).not.toBe("gameover");
  expect(game.exportState().pending_transfers).toBe(0);
});

test("Per-board komi: second opener on each board receives that board's komi", () => {
  const game = new Rizoma({
    boards: [
      { width: 4, height: 4, komi: 6.5 },
      { width: 4, height: 4, komi: 3 },
    ],
    global_komi: 0,
  });
  // B opens board 0 → W gets komi 6.5 on board 0
  game.playMove(0, "0:aa");
  // W opens board 1 → B gets komi 3 on board 1
  game.playMove(1, "1:aa");
  // Double pass to end game
  game.playMove(0, "pass");
  game.playMove(1, "pass");

  const state = game.exportState();
  expect(state.board_scores).toBeDefined();
  expect(state.board_scores![0].komi_recipient).toBe(W); // W gets board-0 komi
  expect(state.board_scores![0].komi).toBe(6.5);
  expect(state.board_scores![1].komi_recipient).toBe(B); // B gets board-1 komi
  expect(state.board_scores![1].komi).toBe(3);
});

test("Global komi is added to White at game end", () => {
  const game = new Rizoma({
    boards: [
      { width: 4, height: 4, komi: 0 },
      { width: 4, height: 4, komi: 0 },
    ],
    global_komi: 0.5,
  });
  // Double pass immediately (no territory, no dynamic komi)
  game.playMove(0, "pass");
  game.playMove(1, "pass");
  // W gets 0.5 global komi, so W wins
  expect(game.result).toBe("W+0.5");
});
