import { BoardPattern } from "../../lib/abstractBoard/boardFactory";
import { Color } from "../baduk";
import { Lighthouse } from "../lighthouse/lighthouse";

const config = {
  komi: 0.5,
  board: { type: BoardPattern.Grid as const, width: 4, height: 2 },
};

function playToResignation() {
  const game = new Lighthouse(config);
  // - W B -
  // - W B -
  game.playMove(0, "ca");
  game.playMove(1, "ba");
  game.playMove(0, "cb");
  game.playMove(1, "bb");
  game.playMove(1, "resign");
  return game;
}

function playWithoutEnding() {
  const game = new Lighthouse(config);
  game.playMove(0, "ca");
  game.playMove(1, "ba");
  game.playMove(0, "cb");
  game.playMove(1, "bb");
  return game;
}

const fullBoard = [
  [Color.EMPTY, Color.WHITE, Color.BLACK, Color.EMPTY],
  [Color.EMPTY, Color.WHITE, Color.BLACK, Color.EMPTY],
];

test("Final state of a completed game: everyone sees full board", () => {
  const game = playToResignation();
  expect(game.phase).toBe("gameover");

  const asBlack = game.exportState({ player: 0, phase: "gameover" });
  const asWhite = game.exportState({ player: 1, phase: "gameover" });
  const asObserver = game.exportState({ phase: "gameover" });

  expect(asBlack.board.map((row) => row.map((f) => f.visibleColor))).toEqual(
    fullBoard,
  );
  expect(asWhite.board.map((row) => row.map((f) => f.visibleColor))).toEqual(
    fullBoard,
  );
  expect(asObserver.board.map((row) => row.map((f) => f.visibleColor))).toEqual(
    fullBoard,
  );
});

test("History review of a completed game: observer sees full, seated keeps own perspective", () => {
  // Mid-game position — `this.phase` is still "play" even though the caller
  // is telling us the overall game has ended. This is what the server hits
  // when serving a past round of a finished game.
  const mid = playWithoutEnding();
  expect(mid.phase).toBe("play");

  const asObserver = mid.exportState({ phase: "gameover" });
  expect(asObserver.board.map((row) => row.map((f) => f.visibleColor))).toEqual(
    fullBoard,
  );

  // Seated black should not get the reveal — they see their own perspective,
  // which does not match the observer's full-board view.
  const asBlack = mid.exportState({ player: 0, phase: "gameover" });
  const asBlackView = asBlack.board.map((row) =>
    row.map((f) => f.visibleColor),
  );
  expect(asBlackView).not.toEqual(fullBoard);
});
