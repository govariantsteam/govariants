import { PyramidGo } from "../pyramid";

test("inner group score", () => {
  const game = new PyramidGo({ width: 9, height: 9, komi: 0 });

  const rounds = [
    ["cc", "cb"],
    ["dc", "db"],
    ["ec", "eb"],
    ["fc", "fb"],
    ["gc", "gb"],
    ["gd", "hc"],
    ["ge", "hd"],
    ["gf", "he"],
    ["gg", "hf"],
    ["fg", "hg"],
    ["eg", "gh"],
    ["dg", "fh"],
    ["cg", "eh"],
    ["cd", "dh"],
    ["cf", "ch"],
    ["ce", "bg"],
    ["pass", "bf"],
    ["pass", "be"],
    ["pass", "bd"],
    ["pass", "bc"],
    ["pass", "pass"],
  ];

  rounds.forEach((round) => {
    game.playMove({ 0: round[0] });
    game.playMove({ 1: round[1] });
  });

  // from https://forums.online-go.com/t/pyramid-go/36944
  // . . . . . . . . .
  // . . W W W W W . .
  // . W B B B B B W .
  // . W B . . . B W .
  // . W B . . . B W .
  // . W B . . . B W .
  // . W B B B B B W .
  // . . W W W W W . .
  // . . . . . . . . .

  expect(game.result).toBe("B+5"); // 80-85
});
