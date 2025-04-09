import {
  Baduk,
  BadukConfig,
  badukVariant,
  Color,
  groupHasLiberties,
} from "./baduk";
import { superTicTacGoRules } from "../templates/super_tic_tac_go_rules";
import { NewGridBadukConfig } from "./baduk_utils";
import { BoardPattern } from "../lib/abstractBoard/boardFactory";
import { Coordinate, CoordinateLike } from "../lib/coordinate";
import { getGroup } from "../lib/group_utils";

export type SuperTicTacGoConfig = {
  komi: number;
  board: {
    type: "grid";
    width: 9;
    height: 9;
  };
};

// Each of the 9 3x3 subgrids on the 9x9 Super Tic-Tac-Go boards
export class Nonant {
  /**
   * X and Y specify which nonant - 0-index, from top-left.
   * @param x 0 | 1 | 2
   * @param y 0 | 1 | 2
   */
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {
    const coordRange = [0, 1, 2];
    if (!coordRange.includes(x) || !coordRange.includes(y)) {
      throw new Error(`${[x, y]} disallowed nonant section`);
    }
  }

  /**
   * Get an array of all the coordinates in this nonant.
   * @returns Array of Coordinate objects
   */
  vertices(): Array<Coordinate> {
    const x = this.x * 3,
      y = this.y * 3;
    return [
      new Coordinate(x, y),
      new Coordinate(x, y + 1),
      new Coordinate(x, y + 2),
      new Coordinate(x + 1, y),
      new Coordinate(x + 1, y + 1),
      new Coordinate(x + 1, y + 2),
      new Coordinate(x + 2, y),
      new Coordinate(x + 2, y + 1),
      new Coordinate(x + 2, y + 2),
    ];
  }

  /**
   * Checks whether a given coordinate is in this nonant.
   * @param coord
   * @returns true of coord is in this, false otherwise
   */
  has(coord: CoordinateLike): boolean {
    return (
      coord.x >= this.x * 3 &&
      coord.x < this.x * 3 + 3 &&
      coord.y >= this.y * 3 &&
      coord.y < this.y * 3 + 3
    );
  }

  equals(other: Nonant): boolean {
    return this.x === other.x && this.y === other.y;
  }

  /**
   * After a move is played, use this to find the next legal nonant.
   * @param coord
   * @returns the nonant that corresponds to a given coordinate.
   */
  static correspondingToCoordinate(coord: CoordinateLike): Nonant {
    return new Nonant(coord.x % 3, coord.y % 3);
  }
}

export class SuperTicTacGo extends Baduk {
  constructor(config: BadukConfig) {
    super(SuperTicTacGo.sanitizeConfig(config));
  }

  override playMove(player: number, move: string): void {
    // move.length === 2 is checking to make sure it's not a 'special' move
    // i should use a better move type checker for this
    if (move.length === 2 && this.last_move.length === 2) {
      const coordinate = super.decodeMove(move);
      const targetNonant = this.getLegalNonant();
      if (
        !targetNonant.has(coordinate) &&
        this.hasOpenPoints(targetNonant)
        // (playing out of legal nonant
        // is allowed if it has no open points)
      ) {
        throw new Error(`${move} out of range of legal nonant`);
      }
    }

    super.playMove(player, move);
  }

  protected override playMoveInternal(move: Coordinate): void {
    super.playMoveInternal(move);
    // handle self-capture
    const group = getGroup(move, this.board);
    if (!groupHasLiberties(group, this.board)) {
      group.forEach((pos) => this.board.set(pos, Color.EMPTY));
      this.captures[this.next_to_play === 0 ? 1 : 0] += group.length;
    }
  }

  override postValidateMove(): void {
    // Allow self-capture moves
    // allow  ko
  }

  override prepareForNextMove(move: string): void {
    if (move === "pass") this.captures[this.next_to_play > 0 ? 0 : 1]++;
    super.prepareForNextMove(move);
  }

  protected getLegalNonant(): Nonant {
    if (this.last_move.length !== 2) {
      throw new Error("all nonants are legal");
    }
    const lastMove = super.decodeMove(this.last_move);
    return Nonant.correspondingToCoordinate(lastMove);
  }

  protected getOpenVerticesInNonant(nonant: Nonant): Array<Coordinate> {
    return nonant.vertices().filter((coord) => {
      return this.board.at(coord) === Color.EMPTY;
    });
  }

  protected hasOpenPoints(nonant: Nonant): boolean {
    return this.getOpenVerticesInNonant(nonant).length > 0;
  }

  static defaultConfig(): NewGridBadukConfig {
    return {
      komi: 0,
      board: {
        type: BoardPattern.Grid,
        width: 9,
        height: 9,
      },
    };
  }

  static sanitizeConfig(config: unknown): SuperTicTacGoConfig {
    let komi: number = SuperTicTacGo.defaultConfig().komi;
    if (typeof config === "object" && config !== null) {
      if ("komi" in config && typeof config.komi === "number") {
        komi = config.komi;
      }
    }
    return {
      komi,
      board: {
        type: "grid",
        width: 9,
        height: 9,
      },
    };
  }
}

export const superTicTacGoVariant: typeof badukVariant = {
  ...badukVariant,
  gameClass: SuperTicTacGo,
  description:
    'Baduk with a twist inspired by the "tic-tac-toe" variant "Super Tic-Tac-Toe"!',
  rulesDescription: superTicTacGoRules.trim(),
  defaultConfig: SuperTicTacGo.defaultConfig,
  sanitizeConfig: SuperTicTacGo.sanitizeConfig,
};
