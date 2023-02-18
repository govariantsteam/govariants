import { MovesType } from "../../abstract_game";
import { AbstractBaduk, AbstractBadukConfig } from "./abstractBaduk";
import { BadukIntersection, AbstractBadukStone } from "./badukIntersection";

interface FooState {
  foo: string;
}

type TestIntersection = BadukIntersection<any, AbstractBadukStone<any>>;

class AbstractBadukTestStone implements AbstractBadukStone<Set<any>> {
  isNew: boolean;
  types: Set<any>;

  constructor(types: Set<any>) {
    this.isNew = true;
    this.types = types;
  }

  possibleChainTypes(): Set<any> {
    return this.types;
  }
}

class AbstractBadukTestChild extends AbstractBaduk<
  AbstractBadukConfig,
  any,
  AbstractBadukStone<any>,
  FooState
> {
  center: TestIntersection;

  constructor() {
    super({ board: { type: "grid", height: 3, width: 3 } });

    this.center = this.intersections.find(
      (intersection) => intersection.neighbours.length === 4
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

  test(types: Set<any>): Map<any, null | Set<TestIntersection>> {
    this.center.stone = new AbstractBadukTestStone(types);
    return this.aCheck(this.center, types, new Map());
  }

  playMove(move: MovesType): void {
    throw new Error("Not implemented");
  }

  defaultConfig(): AbstractBadukConfig {
    return { board: { type: "grid", height: 19, width: 19 } };
  }

  exportState(player?: number): FooState {
    return { foo: "bar" };
  }

  importState(state: FooState): void {
    throw new Error("Not implemented");
  }

  nextToPlay(): number[] {
    return [];
  }

  numPlayers(): number {
    return -Infinity;
  }
}

test("foo", () => {
  const game = new AbstractBadukTestChild();

  const e = game.test(new Set<any>(["e"]));
  expect(Array.from(e)).toHaveLength(1);
  expect(e.get("e")).toBeTruthy();
  expect(Array.from(e.get("e") ?? [])).toHaveLength(1);
  expect(e.get("e")?.has(game.center)).toBeTruthy();

  const a = game.test(new Set<any>(["a"]));
  expect(Array.from(a)).toHaveLength(1);
  expect(a.get("a")).toBeTruthy();
  expect(Array.from(a.get("a") ?? [])).toHaveLength(0);

  const ae = game.test(new Set<any>(["a", "e"]));
  expect(Array.from(ae)).toHaveLength(2);
  expect(ae.get("e")).toBeTruthy();
  expect(Array.from(ae.get("e") ?? [])).toHaveLength(1);
  expect(ae.get("e")?.has(game.center)).toBeTruthy();
  expect(ae.get("a")).toBeTruthy();
  expect(Array.from(ae.get("a") ?? [])).toHaveLength(0);
});
