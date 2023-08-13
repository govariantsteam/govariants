import { CustomGraph, Color } from "../custom_graph";
import { KoError } from "../../lib/ko_detector";
import { Grid } from "../../lib/grid";
import { Coordinate } from "../../lib/coordinate";

const B = Color.BLACK;
const _ = Color.EMPTY;
const W = Color.WHITE;

function make_adjacency_array(width: number, height: number) {
  const empty_grid = new Grid(width, height).fill(undefined);
  const neighbor_grid = empty_grid.map((_val, idx, g) =>
    g.neighbors(idx).map(({ x, y }) => x + width * y),
  );
  return neighbor_grid.to2DArray().flat();
}

test("Play a game", () => {
  const game = new CustomGraph({
    adjacency_array: make_adjacency_array(4, 2),
    komi: 0.5,
  });
  // Tiny board:
  // - W B -
  // - W B -
  expect(game.nextToPlay()).toEqual([0]);
  game.playMove(0, "2");
  expect(game.nextToPlay()).toEqual([1]);
  game.playMove(1, "1");
  expect(game.nextToPlay()).toEqual([0]);
  game.playMove(0, "6");
  expect(game.nextToPlay()).toEqual([1]);
  game.playMove(1, "5");
  expect(game.nextToPlay()).toEqual([0]);

  // check that the final state is as expected
  expect(game.exportState().board).toEqual(
    [
      [_, W, B, _],
      [_, W, B, _],
    ].flat(),
  );

  expect(game.phase).toBe("play");
  game.playMove(0, "pass");
  expect(game.phase).toBe("play");
  game.playMove(1, "pass");

  expect(game.phase).toBe("gameover");
  expect(game.result).toBe("W+0.5");
  expect(game.exportState().score_board).toEqual(
    [
      [W, W, B, B],
      [W, W, B, B],
    ].flat(),
  );
});

test("Play a game with captures", () => {
  const game = new CustomGraph({
    adjacency_array: make_adjacency_array(2, 2),
    komi: 0.5,
  });
  // Tiny board
  // B W
  // B .
  game.playMove(0, "0");
  game.playMove(1, "1");
  game.playMove(0, "2");
  expect(game.exportState().board).toEqual(
    [
      [B, W],
      [B, _],
    ].flat(),
  );

  // Tiny board
  // . W
  // . W
  game.playMove(1, "3");
  expect(game.exportState().board).toEqual(
    [
      [_, W],
      [_, W],
    ].flat(),
  );

  expect(game.phase).toBe("play");
  game.playMove(0, "pass");
  expect(game.phase).toBe("play");
  game.playMove(1, "pass");
  expect(game.phase).toBe("gameover");
  expect(game.result).toBe("W+4.5");
  expect(game.exportState().score_board).toEqual(
    [
      [W, W],
      [W, W],
    ].flat(),
  );
});

test("Resign a game", () => {
  const game = new CustomGraph({
    adjacency_array: make_adjacency_array(19, 19),
    komi: 5.5,
  });
  game.playMove(0, "resign");
  expect(game.phase).toBe("gameover");
  expect(game.result).toBe("W+R");
});

test("Scoring with open borders", () => {
  const game = new CustomGraph({
    adjacency_array: make_adjacency_array(5, 5),
    komi: 6.5,
  });
  game.playMove(0, "7");
  game.playMove(1, "12");
  game.playMove(0, "pass");
  game.playMove(1, "pass");

  expect(game.result).toBe("W+6.5");
});

test("ko", () => {
  // . B W .
  // B . B W
  // . B W .

  const game = new CustomGraph({
    adjacency_array: make_adjacency_array(4, 3),
    komi: 6.5,
  });

  game.playMove(0, "1");
  game.playMove(1, "2");
  game.playMove(0, "4");
  game.playMove(1, "7");
  game.playMove(0, "6");
  game.playMove(1, "10");
  game.playMove(0, "9");

  // White captures
  game.playMove(1, "5");

  // Black captures back
  expect(() => game.playMove(0, "6")).toThrow(KoError);
});

test("inner group score", () => {
  const game = new CustomGraph({
    adjacency_array: make_adjacency_array(9, 9),
    komi: 0,
  });

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
  const graph_idx_rounds = rounds.map((round) =>
    round.map(coord_str_to_index_str(9)),
  );

  graph_idx_rounds.forEach((round) => {
    game.playMove(0, round[0]);
    game.playMove(1, round[1]);
  });

  // . . . . . . . . .
  // . . W W W W W . .
  // . W B B B B B W .
  // . W B . . . B W .
  // . W B . . . B W .
  // . W B . . . B W .
  // . W B B B B B W .
  // . . W W W W W . .
  // . . . . . . . . .

  expect(game.result).toBe("W+31"); // 56 - 25
  expect(game.exportState().score_board).toEqual(
    [
      [W, W, W, W, W, W, W, W, W],
      [W, W, W, W, W, W, W, W, W],
      [W, W, B, B, B, B, B, W, W],
      [W, W, B, B, B, B, B, W, W],
      [W, W, B, B, B, B, B, W, W],
      [W, W, B, B, B, B, B, W, W],
      [W, W, B, B, B, B, B, W, W],
      [W, W, W, W, W, W, W, W, W],
      [W, W, W, W, W, W, W, W, W],
    ].flat(),
  );
});

test("Capture test", () => {
  const game = new CustomGraph({
    adjacency_array: make_adjacency_array(3, 3),
    komi: 6.5,
  });

  const rounds = [
    ["aa", "ba"],
    ["ab", "bc"],
    ["cb", "bb"],
    ["ca", "cc"],
    ["cb", "ac"],
    ["pass", "pass"],
  ];
  const graph_idx_rounds = rounds.map((round) =>
    round.map(coord_str_to_index_str(3)),
  );

  graph_idx_rounds.forEach((round) => {
    game.playMove(0, round[0]);
    game.playMove(1, round[1]);
  });

  expect(game.exportState().board).toEqual(
    [
      [_, W, _],
      [_, W, B],
      [W, W, W],
    ].flat(),
  );
});

function coord_str_to_index_str(width: number) {
  return (coord_str: string) => {
    if (coord_str === "pass") {
      return "pass";
    }
    const pos = Coordinate.fromSgfRepr(coord_str);
    return (pos.x + width * pos.y).toString();
  };
}
