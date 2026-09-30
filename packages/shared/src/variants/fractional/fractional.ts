import { BadukIntersection } from "../../lib/abstractBaduk/badukIntersection";
import {
  AbstractBaduk,
  AbstractBadukConfig,
} from "../../lib/abstractBaduk/abstractBaduk";
import { FractionalStone } from "./fractionalStone";
import {
  BoardConfig,
  BoardPattern,
} from "../../lib/abstractBoard/boardFactory";
import { Variant } from "../../variant";
import { fractionalRulesDescription } from "../../templates/fractional_rules";
import { getNullIndices } from "../../lib/utils";
import { ExportContext } from "../../abstract_game";
import { Dimensions } from "../../lib/dimensions";
import { moveToIndex } from "../../lib/grid_compat";
import { DefaultBoardState, MulticolorStone } from "../../lib/board_types";

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

export interface FractionalState {
  boardState: (Color[] | null)[];
  stagedMove?: { intersectionID: number; colors: Color[] };
  // number representing index of intersection
  lastMoves: (number | null)[];
}

/** The index of the intersection a move names, or null if it names none.
 *
 * Grid boards address intersections by SGF coordinate, as the rest of the
 * platform does. Graph boards address them by index, and so do fractional
 * games recorded before grid boards moved to the shared board, so both
 * encodings are read here.
 */
function intersectionIndex(
  board: BoardConfig,
  intersectionCount: number,
  move: string,
): number | null {
  const index = moveToIndex(move);
  if (typeof index === "number") {
    return Number.isInteger(index) && index >= 0 && index < intersectionCount
      ? index
      : null;
  }
  if (board.type !== BoardPattern.Grid) {
    return null;
  }
  const dimensions = Dimensions.from(board);
  return dimensions.isInBounds(index) ? dimensions.toFlatIndex(index) : null;
}

export class Fractional extends AbstractBaduk<
  FractionalConfig,
  Color,
  FractionalStone,
  FractionalState
> {
  private stagedMoves: (FractionalIntersection | null)[];
  private lastMoves: (FractionalIntersection | null)[];

  constructor(config: FractionalConfig) {
    super(config);
    this.stagedMoves = this.stagedMovesDefaults();
    this.lastMoves = this.lastMovesDefaults();
  }

  playMove(p: number, m: string): void {
    const move = this.decodeMove(p, m);
    if (!move) {
      throw new Error(`Couldn't decode move ${{ player: p, move: m }}`);
    }

    if (move.intersection.stone) {
      throw new Error(`There is already a stone at intersection ${m}`);
    }

    this.stagedMoves[move.player.index] = move.intersection;

    if (
      this.stagedMoves.every(
        (stagedMove): stagedMove is FractionalIntersection =>
          stagedMove !== null,
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

      this.lastMoves = this.stagedMoves;
      this.stagedMoves = this.stagedMovesDefaults();
      super.increaseRound();
    }
  }

  exportState(context: ExportContext): FractionalState {
    // TODO: Deep copy for proper encapsulation
    const player = context.player;
    const stagedIntersection = player != null ? this.stagedMoves[player] : null;
    const stagedMove =
      player != null && stagedIntersection
        ? {
            stagedMove: {
              intersectionID: this.intersections.indexOf(stagedIntersection),
              colors: this.getPlayerColors(player),
            },
          }
        : {};
    return {
      boardState: this.intersections.map((intersection) =>
        intersection.stone ? Array.from(intersection.stone.colors) : null,
      ),
      ...stagedMove,
      lastMoves: this.lastMoves.map((move) =>
        move ? this.intersections.indexOf(move) : null,
      ),
    };
  }

  nextToPlay(): number[] {
    return this.phase === "gameover" ? [] : getNullIndices(this.stagedMoves);
  }

  numPlayers(): number {
    return this.config.players.length;
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
  private decodeMove(p: number, m: string): FractionalMove | null {
    const player = this.config.players[p];
    const index = intersectionIndex(
      this.config.board,
      this.intersections.length,
      m,
    );
    const intersection = index === null ? null : this.intersections[index];
    return player && intersection
      ? { player: { ...player, index: p }, intersection }
      : null;
  }

  private stagedMovesDefaults(): (FractionalIntersection | null)[] {
    return new Array<FractionalIntersection | null>(this.numPlayers()).fill(
      null,
    );
  }

  private lastMovesDefaults(): (FractionalIntersection | null)[] {
    return new Array<FractionalIntersection | null>(this.numPlayers()).fill(
      null,
    );
  }

  static getPlayerColors(config: FractionalConfig, playerNr: number): string[] {
    const playerConfig = config.players.at(playerNr);
    return playerConfig ? Object.values(playerConfig) : [];
  }

  static uiTransform(
    config: FractionalConfig,
    state: FractionalState,
  ): { config: FractionalConfig; gamestate: DefaultBoardState } {
    const stones = state.boardState.map(
      (colors, index): MulticolorStone => ({
        colors: colors ?? [],
        // A stone captured in the round it was played leaves the marker behind
        // on an empty intersection.
        ...(state.lastMoves.includes(index) && { annotation: "CR" as const }),
        // Playing on an occupied intersection is rejected by playMove.
        ...(colors && { disable_move: true as const }),
      }),
    );

    // The move this player has staged for the round looks like any other
    // stone, and its intersection stays clickable so they can move it.
    const staged = state.stagedMove;
    if (staged && stones[staged.intersectionID]) {
      stones[staged.intersectionID] = {
        ...stones[staged.intersectionID],
        colors: staged.colors,
      };
    }

    const board = config.board;
    if (board.type !== BoardPattern.Grid) {
      return { config, gamestate: { board: stones } };
    }
    const { width, height } = Dimensions.from(board);
    return {
      config,
      gamestate: {
        board: Array.from({ length: height }, (_, y) =>
          stones.slice(y * width, (y + 1) * width),
        ),
      },
    };
  }

  static movePreview(
    config: FractionalConfig,
    state: FractionalState,
    move: string,
    player: number,
  ): FractionalState {
    const idx = intersectionIndex(config.board, state.boardState.length, move);
    const colorConfig = config.players.at(player);

    if (idx === null || colorConfig === undefined) {
      return state;
    }

    const boardWithPreview = state.boardState.map(
      (x, index): Color[] | null => {
        if (index === idx) {
          return colorConfig.secondaryColor
            ? [colorConfig.primaryColor, colorConfig.secondaryColor]
            : [colorConfig.primaryColor];
        }

        return x;
      },
    );

    return {
      ...state,
      stagedMove: undefined,
      lastMoves: [...state.lastMoves, idx],
      boardState: boardWithPreview,
    };
  }
}

export const fractionalVariant: Variant<FractionalConfig, FractionalState> = {
  gameClass: Fractional,
  description: "Multiplayer Baduk with multicolored stones and parallel moves",
  rulesDescription: fractionalRulesDescription,
  time_handling: "none",
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
      board: { type: BoardPattern.Grid, width: 19, height: 19 },
    };
  },
  getPlayerColors: Fractional.getPlayerColors,
  uiTransform: Fractional.uiTransform,
  movePreview: Fractional.movePreview,
};
