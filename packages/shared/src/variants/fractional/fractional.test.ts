import {
  Fractional,
  FractionalConfig,
  FractionalIntersection,
} from "./fractional";

class FractionalTestGame extends Fractional {
  readonly firstCorner: FractionalIntersection | undefined;

  constructor(config: Pick<FractionalConfig, "players">) {
    super({ ...config, board: { type: "grid", width: 9, height: 9 } });

    this.firstCorner = this.intersections.find(
      (i) => i.neighbours.length === 2
    );
  }

  countStones(): number {
    return this.intersections.filter((i) => i.stone).length;
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

  expect(game.countStones()).toBe(2);
  expect(
    game.exportState().intersections.find((i) => i.id === Number(cornerId))
      ?.stone
  ).toBeNull();
});

test("Player passes", () => {
  const game = new FractionalTestGame({
    players: [
      { primaryColor: "black", secondaryColor: "green" },
      { primaryColor: "white", secondaryColor: "blue" },
      { primaryColor: "white", secondaryColor: "green" },
    ],
  });

  const intersectionA = game.firstCorner;
  const intersectionB = intersectionA?.neighbours[0];

  game.playMove(1, intersectionA?.id.toString() ?? "");
  game.playMove(2, intersectionB?.id.toString() ?? "");
  expect(game.countStones()).toBe(0);

  game.playMove(0, "pass");
  expect(game.countStones()).toBe(2);
  expect(intersectionA?.stone?.colors.has("white")).toBeTruthy();
  expect(intersectionA?.stone?.colors.has("blue")).toBeTruthy();
  expect(intersectionA?.stone?.colors.has("black")).toBeFalsy();

  expect(intersectionB?.stone?.colors.has("white")).toBeTruthy();
  expect(intersectionB?.stone?.colors.has("green")).toBeTruthy();
  expect(intersectionB?.stone?.colors.has("black")).toBeFalsy();
});
