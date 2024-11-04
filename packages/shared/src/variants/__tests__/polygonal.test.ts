import { CreatePolygonalBoard } from "../../lib/abstractBoard/helper/PolygonalBoardHelper";

test("Polygonal board has correct number of tiles", () => {
  const numberOfFullRings = 20;

  const board = CreatePolygonalBoard(2 * numberOfFullRings - 1);
  const expectedTiles =
    1 + (6 * (numberOfFullRings * (numberOfFullRings - 1))) / 2;

  expect(board.length).toBe(6 * expectedTiles);
});
