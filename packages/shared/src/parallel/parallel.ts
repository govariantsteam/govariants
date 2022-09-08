import { AbstractGame, MovesType } from "../abstract_game";
import { Grid } from "../grid";

export interface ParallelGoConfig {
  width: number;
  height: number;
  num_players: number;
  /**
   * - merge: collisions result in a multicolor stone which dies if it any of
   *   its colors would die.
   * - pass: no stones are played on this point.
   * - ko: a "blocking" stone is played at this point, and no players may play
   *   there on the next turn.
   */
  collision_handling: "merge" | "pass" | "ko";
}

export interface ParallelGoState {
  board: number[][][];
  staged: MovesType;
}

interface Coordinate {
  readonly x: number;
  readonly y: number;
}

export class ParallelGo extends AbstractGame<ParallelGoConfig, ParallelGoState> {
  private board: Grid<number[]>;
  private staged: MovesType = {};

  constructor(config: ParallelGoConfig) {
    super(config);
    this.board = new Grid(config.width, config.height)
      .fill(undefined)
      .map(() => []);
  }

  exportState(player?: number): ParallelGoState {
    let staged = { ...this.staged };
    if (player !== undefined) {
      staged = this.staged[player] ? { [player]: this.staged[player] } : {};
    }
    return {
      board: this.board.to2DArray(),
      staged,
    };
  }

  importState(state: ParallelGoState) {
    this.board = Grid.from2DArray(state.board);
    this.staged = state.staged;
  }

  nextToPlay(): number[] {
    return [...Array(this.config.num_players).keys()];
  }

  playMove(moves: MovesType): void {
    const { player, move } = getOnlyMove(moves);

    if (!Object.keys(this.specialMoves()).includes(move)) {
      const decoded_move = decodeMove(move);
      const occupants = this.board.at(decoded_move);
      if (occupants === undefined) {
        throw Error(
          `Move out of bounds. (move: ${decoded_move}, board dimensions: ${this.board.width}x${this.board.height}`
        );
      }
      if (occupants.length !== 0) {
        throw new Error("Can't play on existing stone.");
      }
    }

    this.staged[player] = move;

    if (Object.entries(this.staged).length !== this.numPlayers()) {
      // Don't play moves until everybody has staged a move
      return;
    }

    let num_passes = 0;
    Object.entries(this.staged).forEach(([player_str, move]) => {
      if (move === "pass") {
        num_passes++;
        return;
      }
      const decoded_move = decodeMove(move);
      const player = Number(player_str);
      this.board.at(decoded_move)?.push(player);
    });
    if (num_passes === this.numPlayers()) {
      this.phase = "gameover";
    }
    this.staged = [];

    if (this.config.collision_handling === "pass") {
      this.replaceMultiColoredStonesWith([]);
    }
    if (this.config.collision_handling === "ko") {
      this.replaceMultiColoredStonesWith([-1]);
    }
  }

  numPlayers(): number {
    return this.config.num_players;
  }

  specialMoves() {
    // TODO: support resign
    return { pass: "Pass" };
  }

  replaceMultiColoredStonesWith(arr: number[]) {
    this.board = this.board.map((intersection) =>
      intersection.length > 1 ? [...arr] : intersection
    );
  }
}

function decodeMove(move: string): Coordinate {
  return { x: decodeChar(move[0]), y: decodeChar(move[1]) };
}

// a: 0, b: 1, ... z: 25, A: 26, ... Z: 51
function decodeChar(char: string): number {
  const a = "a".charCodeAt(0);
  const z = "z".charCodeAt(0);
  const A = "A".charCodeAt(0);
  const Z = "Z".charCodeAt(0);
  const char_code = char.charCodeAt(0);
  if (char_code >= a && char_code <= z) {
    return char_code - a;
  }
  if (char_code >= A && char_code <= Z) {
    return char_code - A + 26;
  }

  throw `Invalid character in move: ${char} (${char_code})`;
}

/** Asserts there is exactly one move, and returns it */
function getOnlyMove(moves: MovesType): { player: number; move: string } {
  const players = Object.keys(moves);
  if (players.length > 1) {
    throw Error(`More than one player: ${players}`);
  }
  if (players.length === 0) {
    throw Error("No players specified!");
  }
  const player = Number(players[0]);
  return { player, move: moves[player] };
}
