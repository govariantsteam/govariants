import { normalizeNextToPlay } from "../next_to_play";

test("normalizeNextToPlay", () => {
  expect(normalizeNextToPlay(5)).toEqual({ required: [5], optional: [] });
  expect(normalizeNextToPlay([1, 2, 3])).toEqual({
    required: [1, 2, 3],
    optional: [],
  });
  expect(normalizeNextToPlay({ required: [1, 3], optional: [2] })).toEqual({
    required: [1, 3],
    optional: [2],
  });
});
