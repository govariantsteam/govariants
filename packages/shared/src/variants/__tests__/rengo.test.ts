import { BadukState, Color } from "../baduk";
import { FractionalState } from "../fractional";
import { Rengo } from "../rengo";

const B = Color.BLACK;
const _ = Color.EMPTY;
const W = Color.WHITE;

test("rengo + baduk", () => {
  const game = new Rengo<BadukState>({
    subVariant: "baduk",
    subVariantConfig: {
      komi: 6.5,
      board: {
        type: "grid",
        width: 3,
        height: 3,
      },
    },
    teamSizes: [2, 2],
  });

  game.playMove(0, "bb");
  game.playMove(2, "bc");
  game.playMove(1, "cb");
  game.playMove(3, "ab");
  game.playMove(0, "ba");
  game.playMove(2, "pass");
  game.playMove(1, "aa");
  game.playMove(3, "pass");
  game.playMove(0, "ac");

  expect(game.numPlayers()).toEqual(4);
  expect(game.round).toEqual(9);
  expect(game.nextToPlay()).toEqual([2]);
  expect(game.exportState().board).toEqual([
    [B, B, _],
    [_, B, B],
    [B, W, _],
  ]);

  game.playMove(2, "pass");
  game.playMove(1, "pass");

  expect(game.phase).toEqual("gameover");
  expect(game.nextToPlay()).toEqual([]);
  expect(game.exportState().score_board).toEqual([
    [B, B, B],
    [B, B, B],
    [B, W, _],
  ]);
  expect(game.result).toEqual("W+0.5");
});

test("rengo + baduk with different team sizes", () => {
  const game = new Rengo<BadukState>({
    subVariant: "baduk",
    subVariantConfig: {
      komi: 6.5,
      board: {
        type: "grid",
        width: 3,
        height: 3,
      },
    },
    teamSizes: [2, 3],
  });

  game.playMove(0, "bb");
  game.playMove(2, "bc");
  game.playMove(1, "cb");
  game.playMove(3, "ab");
  game.playMove(0, "ba");
  game.playMove(4, "pass");
  game.playMove(1, "aa");
  game.playMove(2, "pass");
  game.playMove(0, "ac");

  expect(game.numPlayers()).toEqual(5);
  expect(game.round).toEqual(9);
  expect(game.nextToPlay()).toEqual([3]);
  expect(game.exportState().board).toEqual([
    [B, B, _],
    [_, B, B],
    [B, W, _],
  ]);

  game.playMove(3, "pass");
  game.playMove(1, "pass");

  expect(game.phase).toEqual("gameover");
  expect(game.nextToPlay()).toEqual([]);
  expect(game.exportState().score_board).toEqual([
    [B, B, B],
    [B, B, B],
    [B, W, _],
  ]);
  expect(game.result).toEqual("W+0.5");
});

test("rengo + fractional", () => {
  const game = new Rengo<FractionalState>({
    subVariant: "fractional",
    subVariantConfig: {
      board: {
        type: "grid",
        width: 3,
        height: 3,
      },
      players: [
        {
          primaryColor: "B",
          secondaryColor: "R",
        },
        {
          primaryColor: "B",
          secondaryColor: "G",
        },
        {
          primaryColor: "W",
          secondaryColor: "R",
        },
        {
          primaryColor: "W",
          secondaryColor: "G",
        },
      ],
    },
    teamSizes: [2, 2, 2, 2],
  });

  const rounds = [
    ["8", null, "4", null, "3", null, "4", null],
    [null, "6", null, "0", null, "5", null, "7"],
  ];

  rounds.forEach((round) => {
    round.forEach((move, index) => {
      if (move !== null) {
        game.playMove(index, move);
      }
    });
  });

  expect(game.round).toEqual(2);
  expect(game.nextToPlay()).toEqual([0, 2, 4, 6]);
  expect(game.exportState().boardState).toEqual([
    ["B", "G"],
    null,
    null,
    null,
    ["B", "G", "W"],
    ["W", "R"],
    null,
    ["W", "G"],
    null,
  ]);
});
