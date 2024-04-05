import { BoardPattern } from "../abstractBoard/boardFactory";
import { AbstractBaduk, AbstractBadukConfig } from "./abstractBaduk";
import { BadukIntersection, AbstractBadukStone } from "./badukIntersection";

type TestState = "test";

type TestChainType = "a" | "b" | "c" | "d" | "e";
type TestIntersection = BadukIntersection<
  TestChainType,
  AbstractBadukStone<TestChainType>
>;

class AbstractBadukTestStone implements AbstractBadukStone<TestChainType> {
  isNew: boolean;
  types: Set<TestChainType>;

  constructor(types: Set<TestChainType>) {
    this.isNew = true;
    this.types = types;
  }

  getChainTypes(): Set<TestChainType> {
    return this.types;
  }
}

class AbstractBadukTestGame extends AbstractBaduk<
  AbstractBadukConfig,
  TestChainType,
  AbstractBadukStone<TestChainType>,
  TestState
> {
  center: TestIntersection;

  constructor() {
    super({ board: { type: BoardPattern.Grid, height: 3, width: 3 } });

    this.center = this.intersections.find(
      (intersection) => intersection.neighbours.length === 4,
    )!;
    // console.log(this.center);
    this.center.neighbours.forEach((neighbour, index) => {
      switch (index) {
        case 0:
          neighbour.stone = new AbstractBadukTestStone(new Set<any>(["a"]));
          break;
        case 1:
          neighbour.stone = new AbstractBadukTestStone(new Set<any>(["b"]));
          break;
        case 2:
          neighbour.stone = new AbstractBadukTestStone(new Set<any>(["c"]));
          break;
        case 3:
          neighbour.stone = new AbstractBadukTestStone(new Set<any>(["d"]));
          break;
      }
    });
  }

  test(
    types: Set<TestChainType>,
  ): Map<TestChainType, null | Set<TestIntersection>> {
    this.center.stone = new AbstractBadukTestStone(types);
    return this.findChainsWithoutLiberties(this.center, types, new Map());
  }

  playMove(_player: number, _move: string): void {
    throw new Error("Not implemented");
  }

  defaultConfig(): AbstractBadukConfig {
    return { board: { type: BoardPattern.Grid, height: 19, width: 19 } };
  }

  exportState(_player?: number): TestState {
    return "test";
  }

  importState(_state: TestState): void {
    throw new Error("Not implemented");
  }

  nextToPlay(): number[] {
    return [];
  }

  numPlayers(): number {
    return -Infinity;
  }
}

test("Test AbstractBaduk.findChainsWithoutLiberties()", () => {
  const game = new AbstractBadukTestGame();

  const e = game.test(new Set<TestChainType>(["e"]));
  expect(Array.from(e)).toHaveLength(1);
  expect(e.get("e")).toBeTruthy();
  expect(Array.from(e.get("e") ?? [])).toHaveLength(1);
  expect(e.get("e")?.has(game.center)).toBeTruthy();

  const a = game.test(new Set<TestChainType>(["a"]));
  expect(Array.from(a)).toHaveLength(1);
  expect(a.get("a")).toBeTruthy();
  expect(Array.from(a.get("a") ?? [])).toHaveLength(0);

  const ae = game.test(new Set<TestChainType>(["a", "e"]));
  expect(Array.from(ae)).toHaveLength(2);
  expect(ae.get("e")).toBeTruthy();
  expect(Array.from(ae.get("e") ?? [])).toHaveLength(1);
  expect(ae.get("e")?.has(game.center)).toBeTruthy();
  expect(ae.get("a")).toBeTruthy();
  expect(Array.from(ae.get("a") ?? [])).toHaveLength(0);
});
