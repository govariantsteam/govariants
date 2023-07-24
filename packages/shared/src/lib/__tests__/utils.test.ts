import { getOnlyMove } from "../utils";

const MOVE_STRING = "test";

test("getOnlyMove", () => {
  expect(getOnlyMove({ 1: MOVE_STRING })).toEqual({
    player: 1,
    move: MOVE_STRING,
  });
});

test("getOnlyMove - more than one move", () => {
  expect(() => getOnlyMove({ 1: MOVE_STRING, 2: MOVE_STRING })).toThrow(
    "More than one player: 1,2",
  );
});

test("getOnlyMove - no moves", () => {
  expect(() => getOnlyMove({})).toThrow("No players specified!");
});
