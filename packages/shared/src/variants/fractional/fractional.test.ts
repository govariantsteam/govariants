import { BoardPattern } from "../../lib/abstractBoard/boardFactory";
import {
  Fractional,
  FractionalConfig,
  FractionalIntersection,
} from "./fractional";

class FractionalTestGame extends Fractional {
  readonly corners: FractionalIntersection[];

  constructor(config: Pick<FractionalConfig, "players">) {
    super({
      ...config,
      board: { type: BoardPattern.Grid, width: 9, height: 9 },
    });

    this.corners = this.intersections.filter((i) => i.neighbours.length === 2);
  }

  indexOf(intersection: FractionalIntersection): number {
    return this.intersections.indexOf(intersection);
  }
  idOf(intersection: FractionalIntersection): string {
    const index = this.intersections.indexOf(intersection);
    return index < 0 ? "" : `${index}`;
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

  expect(game.corners).toHaveLength(4);
  expect(game.corners[0]).toBeTruthy();
  expect(game.corners[0]?.neighbours.length).toBe(2);
  expect(game.corners[0]?.neighbours[0]).toBeTruthy();
  expect(game.corners[0]?.neighbours[1]).toBeTruthy();

  const cornerId = game.idOf(game.corners[0]);
  const neighbour0Id = game.idOf(game.corners[0].neighbours[0]);
  const neighbour1Id = game.idOf(game.corners[0].neighbours[1]);

  // Round 1
  game.playMove(0, neighbour0Id);
  game.playMove(1, neighbour1Id);
  game.playMove(2, cornerId);
  expect(game.corners[0]?.stone).toBeNull();

  // Round 2
  game.playMove(0, cornerId);
  game.playMove(1, cornerId);
  game.playMove(2, cornerId);

  const state = game.exportState();
  expect(state.boardState.filter((i) => i).length).toBe(2);
  expect(state.boardState.at(Number(cornerId))).toBeNull();
});

test("A surrounded stone with other long chains on the board", () => {
  const game = new FractionalTestGame({
    players: [
      { primaryColor: "black", secondaryColor: "green" },
      { primaryColor: "white", secondaryColor: "green" },
    ],
  });

  // . . . . .(B)B B B  // Additional chains on the board have historically
  // . . . . . . W W W  // caused issues with the liberty check
  // . ...5 lines... .
  // . . . . . . . . W
  // . . . . . . .(W)B  // White's last move should capture black's corner stone

  game.playMove(0, game.idOf(game.corners[3]));
  game.playMove(1, game.idOf(game.corners[3].neighbours[0]));

  for (let i = 8; i >= 6; --i) {
    game.playMove(0, `${i}`);
    game.playMove(1, `${i + 9}`);
  }

  game.playMove(0, "5");
  game.playMove(1, game.idOf(game.corners[3].neighbours[1]));

  expect(game.corners[3].stone).toBeFalsy();
});
