import { MovesType } from "../../abstract_game";
import { BadukIntersection } from "../../lib/abstractBaduk/badukIntersection";
import {
  AbstractBaduk,
  AbstractBadukConfig,
} from "../../lib/abstractBaduk/abstractBaduk";
import { FractionalStone } from "./fractionalStone";
import { getOnlyMove } from "../../lib/utils";

export type Color =
  | "black"
  | "white"
  | "red"
  | "green"
  | "blue"
  | "cyan"
  | "magenta"
  | "yellow";

interface FractionalPlayerConfig {
  primaryColor: Color;
  secondaryColor?: Color;
}

interface FractionalPlayer extends FractionalPlayerConfig {
  index: number;
}

export type FractionalIntersection = BadukIntersection<Color, FractionalStone>;

interface FractionalMove {
  player: FractionalPlayer;
  intersection: FractionalIntersection;
}

export interface FractionalConfig extends AbstractBadukConfig {
  players: FractionalPlayerConfig[];
}

// TODO: Circular dependencies! Does state have to be JSON.stringifyable?
export interface FractionalState {
  intersections: FractionalIntersection[];
  stagedMove?: { intersection: FractionalIntersection; colors: Color[] };
}

export class Fractional extends AbstractBaduk<
  FractionalConfig,
  Color,
  FractionalStone,
  FractionalState
> {
  private stagedMoves: (FractionalIntersection | null)[];

  constructor(config?: FractionalConfig) {
    super(config);
    this.stagedMoves = this.stagedMovesDefaults();
  }

  playMove(moves: MovesType): void {
    const move = this.decodeMove(moves);
    if (!move) {
      throw new Error(`Couldn't decode move ${moves}`);
    }

    if (move.intersection.stone) {
      throw new Error(
        `There is already a stone at intersection ${move.intersection.id}`
      );
    }

    this.stagedMoves[move.player.index] = move.intersection;

    if (
      this.stagedMoves.every(
        (stagedMove): stagedMove is FractionalIntersection =>
          stagedMove !== null
      )
    ) {
      this.intersections.forEach((intersection) => {
        if (intersection.stone) intersection.stone.isNew = false;
      });

      // place all moves and proceed to next round
      const playedIntersections = new Set<FractionalIntersection>();
      this.stagedMoves.forEach((intersection, playerId) => {
        playedIntersections.add(intersection);
        const colors =
          intersection.stone?.colors ??
          (() => {
            const newColors = new Set<Color>();
            intersection.stone = new FractionalStone(newColors);
            return newColors;
          })();
        this.getPlayerColors(playerId).forEach((color) => colors.add(color));
      });

      this.removeChains(false);

      this.stagedMoves = this.stagedMovesDefaults();
    }
  }

  exportState(player?: number): FractionalState {
    // TODO: Deep copy for proper encapsulation
    const stagedIntersection = player != null ? this.stagedMoves[player] : null;
    const stagedMove =
      player != null && stagedIntersection
        ? {
            stagedMove: {
              intersection: stagedIntersection,
              colors: this.getPlayerColors(player),
            },
          }
        : {};
    return {
      intersections: this.intersections,
      ...stagedMove,
    };
  }

  importState(state: FractionalState): void {
    throw new Error("Method not implemented.");
  }

  nextToPlay(): number[] {
    return [...Array(this.config.players.length).keys()];
  }

  numPlayers(): number {
    return this.config.players.length;
  }

  defaultConfig(): FractionalConfig {
    return {
      players: [
        { primaryColor: "black", secondaryColor: "red" },
        { primaryColor: "black", secondaryColor: "green" },
        { primaryColor: "black", secondaryColor: "blue" },
        { primaryColor: "white", secondaryColor: "red" },
        { primaryColor: "white", secondaryColor: "green" },
        { primaryColor: "white", secondaryColor: "blue" },
      ],
      board: { type: "grid", width: 19, height: 19 },
    };
  }

  private getPlayerColors(id: number): Color[] {
    const player = this.config.players[id];
    const colors = [player.primaryColor];
    if (player.secondaryColor) {
      colors.push(player.secondaryColor);
    }
    return colors;
  }

  /** Asserts there is exactly one move of type FractionalMove and returns it */
  private decodeMove(moves: MovesType): FractionalMove | null {
    const move = getOnlyMove(moves);
    const player = this.config.players[move.player];
    const intersection = this.intersections.find(
      (intersection) => intersection.id === Number.parseInt(move.move)
    );
    return player && intersection
      ? { player: { ...player, index: move.player }, intersection }
      : null;
  }

  private stagedMovesDefaults(): (FractionalIntersection | null)[] {
    return new Array<FractionalIntersection | null>(this.numPlayers()).fill(
      null
    );
  }
}
