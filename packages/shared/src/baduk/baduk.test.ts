import { Color, Baduk } from "./baduk";

test("Play a game", () => {
  const game = new Baduk({ width: 4, height: 2 });
  // Tiny board:
  // - W B -
  // - W B -
  expect(game.nextToPlay()).toEqual([0]);
  game.playMove({ 0: "ca" });
  expect(game.nextToPlay()).toEqual([1]);
  game.playMove({ 1: "ba" });
  expect(game.nextToPlay()).toEqual([0]);
  game.playMove({ 0: "cb" });
  expect(game.nextToPlay()).toEqual([1]);
  game.playMove({ 1: "bb" });
  expect(game.nextToPlay()).toEqual([0]);

  // check that the final state is as expected
  expect(game.exportState().board).toEqual([
    [Color.EMPTY, Color.WHITE, Color.BLACK, Color.EMPTY],
    [Color.EMPTY, Color.WHITE, Color.BLACK, Color.EMPTY],
  ]);
});
