import { BoardPattern } from "../../lib/abstractBoard/boardFactory";
import {
  Fractional,
  FractionalConfig,
  FractionalIntersection,
} from "./fractional";

class FractionalTestGame extends Fractional {
  readonly firstCorner: FractionalIntersection | undefined;

  constructor(config: Pick<FractionalConfig, "players">) {
    super({
      ...config,
      board: { type: BoardPattern.Grid, width: 9, height: 9 },
    });

    this.firstCorner = this.intersections.find(
      (i) => i.neighbours.length === 2,
    );
  }
}

test("Surrounded merge stone", () => {
  const game = new FractionalTestGame({
    players: [
      { primaryColor: "black", secondaryColor: "blue" },
      { primaryColor: "black", secondaryColor: "green" },
      { primaryColor: "white", secondaryColor: "green" },
    ],
  });

  // TODO: Better typing

  expect(game.firstCorner).toBeTruthy();
  expect(game.firstCorner?.neighbours.length).toBe(2);
  expect(game.firstCorner?.neighbours[0]).toBeTruthy();
  expect(game.firstCorner?.neighbours[1]).toBeTruthy();

  const cornerId = game.firstCorner?.id.toString() ?? "";
  const neighbour0Id = game.firstCorner?.neighbours[0].id.toString() ?? "";
  const neighbour1Id = game.firstCorner?.neighbours[1].id.toString() ?? "";

  // Round 1
  game.playMove(0, neighbour0Id);
  game.playMove(1, neighbour1Id);
  game.playMove(2, cornerId);
  expect(game.firstCorner?.stone).toBeNull();

  // Round 2
  game.playMove(0, cornerId);
  game.playMove(1, cornerId);
  game.playMove(2, cornerId);

  const state = game.exportState();
  expect(state.boardState.filter((i) => i).length).toBe(2);
  expect(state.boardState.at(Number(cornerId))).toBeNull();
});
