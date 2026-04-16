import { BoardPattern } from "../../lib/abstractBoard/boardFactory";
import { Color } from "../baduk";
import { Lighthouse } from "../lighthouse/lighthouse";

const config = {
  komi: 0.5,
  board: { type: BoardPattern.Grid as const, width: 4, height: 2 },
};

function playGameAndResign() {
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

test("gameover: seated player sees full board (post-game reveal)", () => {
  const game = playGameAndResign();

  const asBlack = game.exportState({ player: 0, phase: "gameover" });
  const asWhite = game.exportState({ player: 1, phase: "gameover" });
  const asObserver = game.exportState({ phase: "gameover" });

  const expectedVisible = [
    [Color.EMPTY, Color.WHITE, Color.BLACK, Color.EMPTY],
    [Color.EMPTY, Color.WHITE, Color.BLACK, Color.EMPTY],
  ];

  expect(asBlack.board.map((row) => row.map((f) => f.visibleColor))).toEqual(
    expectedVisible,
  );
  expect(asWhite.board.map((row) => row.map((f) => f.visibleColor))).toEqual(
    expectedVisible,
  );
  expect(asObserver.board.map((row) => row.map((f) => f.visibleColor))).toEqual(
    expectedVisible,
  );
});

test("history review: gameover context reveals even at a pre-gameover replay point", () => {
  // Replayed game object is still "play" at the viewed round — this is what
  // the server's history endpoint does for a completed game.
  const replayed = new Lighthouse(config);
  replayed.playMove(0, "ca");
  replayed.playMove(1, "ba");
  replayed.playMove(0, "cb");
  replayed.playMove(1, "bb");

  expect(replayed.phase).toBe("play");

  const asBlack = replayed.exportState({ player: 0, phase: "gameover" });
  const visibleAsBlack = asBlack.board.map((row) =>
    row.map((f) => f.visibleColor),
  );
  expect(visibleAsBlack).toEqual([
    [Color.EMPTY, Color.WHITE, Color.BLACK, Color.EMPTY],
    [Color.EMPTY, Color.WHITE, Color.BLACK, Color.EMPTY],
  ]);
});
