import { FreezeGo } from "../freeze";

test("four stone group throws", () => {
  const game = new FreezeGo({ width: 5, height: 2, komi: 0.5 });
  // B . . . .
  // W . . . B
  game.playMove(0, "aa");
  game.playMove(1, "ab");
  game.playMove(0, "ea");
  game.playMove(1, "eb");
  // B . . . B  <-- atari
  // W . . .(W)

  // B . . . B
  // .(B). . W
  //   ^ illegal capture
  expect(() => {
    game.playMove(0, "bb");
  }).toThrow(/capture.*atari/);
});
