import { AbstractGame } from "../../abstract_game";
import { BoardConfig } from "../abstractBoard/boardFactory";
import { AbstractBadukStone, BadukIntersection } from "./badukIntersection";
import { createBoard } from "../abstractBoard/boardFactory";

export interface AbstractBadukConfig {
  board: BoardConfig;
}

/**
 * A Go-like game played by placing stones on intersections of a board.
 *
 * Stones can form chains with neighbouring stones.
 * Chains can have liberties (i.e. empty intersections next to them).
 * Chains without liberties will be removed from the board.
 * Old chains are removed first, then new chains (with still no liberties) are removed.
 * New chains are chains containing new stones.
 */
export abstract class AbstractBaduk<
  TConfig extends AbstractBadukConfig,
  TChainType,
  TStone extends AbstractBadukStone<TChainType>,
  TState
> extends AbstractGame<TConfig, TState> {
  // TODO: Maybe less generic types needed? Fix types here?
  protected intersections: BadukIntersection<TChainType, TStone>[];

  constructor(config?: TConfig) {
    super(config);
    this.intersections = createBoard(
      this.config.board,
      BadukIntersection<TChainType, TStone>
    );
  }

  protected removeChains(setNewToOld = true) {
    /*
      TODO:
        * Check old chains (next to new stones) for liberties
        * Remove old chains without liberties
        * Check new chains (new stones are part of them) for liberties
        * Remove new chains without liberties
    */

    // TODO: Name
    const changedIntersections = this.intersections
      .filter((intersection) => intersection.stone?.isNew)
      .flatMap((intersection) => intersection.neighbours);

    const chainsWithoutLiberties: Set<BadukIntersection<TChainType, TStone>>[] =
      [];
    const checkedIntersections: Map<number, Set<TChainType>> = new Map();

    changedIntersections.forEach((intersection) => {
      if (!intersection.stone) {
        return;
      }

      const uncheckedChainTypes = new Set(
        Array.from(intersection.stone.possibleChainTypes()).filter(
          (chainType) =>
            !(
              checkedIntersections.get(intersection.id) ?? new Set<TChainType>()
            ).has(chainType)
        )
      );

      if (!uncheckedChainTypes.size) {
        return;
      }

      const checkedNow: Map<number, Set<TChainType>> = new Map();
      this.aCheck(intersection, uncheckedChainTypes, checkedNow).forEach(
        (chain) => {
          if (chain) chainsWithoutLiberties.push(chain);
        }
      );

      checkedNow.forEach((chainTypes, intersectionId) =>
        chainTypes.forEach((chainType) =>
          (
            checkedIntersections.get(intersectionId) ??
            (() => {
              const defaultValue = new Set<TChainType>();
              checkedIntersections.set(intersectionId, defaultValue);
              return defaultValue;
            })()
          ).add(chainType)
        )
      );
    });

    chainsWithoutLiberties
      .filter((chain) =>
        Array.from(chain).every((intersection) => !intersection.stone?.isNew)
      )
      .forEach((chain) =>
        chain.forEach((intersection) => (intersection.stone = null))
      );

    chainsWithoutLiberties
      .filter((chain) =>
        Array.from(chain).every((intersection) =>
          intersection.neighbours.every((neighbour) => neighbour.stone)
        )
      )
      .forEach((chain) =>
        chain.forEach((intersection) => (intersection.stone = null))
      );

    if (setNewToOld) {
      changedIntersections.forEach((intersection) => {
        if (intersection.stone?.isNew) intersection.stone.isNew = false;
      });
    }
  }

  // Returns per chainType unchecked "adjacent" intersections without liberties
  // "neighbouring" is transitive and reflexive
  aCheck(
    intersection: BadukIntersection<TChainType, TStone>,
    chainTypes: Set<TChainType>,
    checked: Map<number, Set<TChainType>>
  ): Map<TChainType, null | Set<BadukIntersection<TChainType, TStone>>> {
    const s = `aCheck(${intersection.id}, [${[...chainTypes]}], [${[
      ...checked,
    ].map(([id, s]) => `${id}: [${[...s]}]`)}]), chains: ${
      intersection.stone
        ? `[${[...intersection.stone.possibleChainTypes()]}]`
        : "no stone"
    }, neighbours: [${intersection.neighbours.map((n) => n.id)}]`;
    console.log(`called: ${s}`);
    if (intersection.stone === null) {
      console.log("returns, liberty found");
      return new Map(
        Array.from(chainTypes).map((chainType) => [chainType, new Set()])
      );
    }

    const checkedChainTypes =
      checked.get(intersection.id) ??
      (() => {
        const defaultValue = new Set<TChainType>();
        checked.set(intersection.id, defaultValue);
        return defaultValue;
      })();

    const uncheckedChainTypes = Array.from(
      intersection.stone.possibleChainTypes()
    ).filter(
      (chainTypeOfStone) =>
        !checkedChainTypes.has(chainTypeOfStone) &&
        Array.from(chainTypes).some(
          (chainTypeToCheck) => chainTypeOfStone === chainTypeToCheck
        )
    );

    if (!uncheckedChainTypes.length) {
      console.log(`returns: null`);
      return new Map(Array.from(chainTypes).map((ct) => [ct, null]));
    }

    Array.from(chainTypes).forEach((chainType) =>
      checkedChainTypes.add(chainType)
    );

    const neighbouringResults = intersection.neighbours.map((neighbour) =>
      this.aCheck(neighbour, new Set(uncheckedChainTypes), checked)
    );

    const r = new Map(
      Array.from(chainTypes).map((chainType) => {
        if (!intersection.stone?.possibleChainTypes().has(chainType)) {
          return [chainType, null];
        }
        const neighbouringChains = neighbouringResults.map(
          (neighbouringResult) => neighbouringResult.get(chainType)
        );

        console.log(`id: ${intersection.id}, chainType: ${chainType}`);
        console.log(
          `NCs: [${[
            ...neighbouringChains.map((chain) =>
              chain
                ? `${[...chain].map((i) => i.id)}`
                : chain === null
                ? "null"
                : "undefined"
            ),
          ]}], some: ${neighbouringChains.some((chain) => chain?.size === 0)}`
        );

        if (neighbouringChains.some((chain) => chain?.size === 0)) {
          return [chainType, new Set<BadukIntersection<TChainType, TStone>>()];
        }

        return [
          chainType,
          new Set([
            intersection,
            ...neighbouringChains.flatMap((intersections) =>
              intersections ? Array.from(intersections) : []
            ),
          ]),
        ];
      })
    );

    console.log(
      `${s}\nreturns:\n${[...r]
        .map(
          ([chainType, intersections]) =>
            `${chainType}: ${
              intersections ? `[${[...intersections].map((i) => i.id)}]` : null
            }`
        )
        .join("\n")}`
    );

    return r;
  }
}
