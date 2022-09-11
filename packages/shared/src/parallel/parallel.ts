import { AbstractGame, MovesType } from "../abstract_game";
import { Coordinate } from "../coordinate";
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
  last_round: MovesType;
}

export class ParallelGo extends AbstractGame<
  ParallelGoConfig,
  ParallelGoState
> {
  private board: Grid<number[]>;
  private staged: MovesType = {};
  private last_round: MovesType = {};

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
      last_round: { ...this.last_round },
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
      const decoded_move = Coordinate.fromSgfRepr(move);
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

    // Remove ko stones
    this.board = this.board.map((colors) => (colors[0] === -1 ? [] : colors));

    let num_passes = 0;
    Object.entries(this.staged).forEach(([player_str, move]) => {
      if (move === "pass") {
        num_passes++;
        return;
      }
      const decoded_move = Coordinate.fromSgfRepr(move);
      const player = Number(player_str);
      this.board.at(decoded_move)?.push(player);
    });
    if (num_passes === this.numPlayers()) {
      this.phase = "gameover";
    }
    this.last_round = this.staged;
    this.staged = {};

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
