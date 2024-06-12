import { AbstractGame } from "../abstract_game";
import { Coordinate } from "../lib/coordinate";
import { Grid } from "../lib/grid";
import { MovesType, Participation } from "../lib/utils";

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
  private playerParticipation = this.initializeParticipation(
    this.config.num_players,
  );

  constructor(config?: ParallelGoConfig) {
    super(config);
    this.board = new Grid(this.config.width, this.config.height)
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

  nextToPlay(): number[] {
    return this.phase === "gameover"
      ? []
      : this.playerParticipation
          .filter(
            (x) => x.dropOutAtRound === null || x.dropOutAtRound > this.round,
          )
          .map((p) => p.playerNr);
  }

  playMove(player: number, move: string): void {
    if (!Object.keys(this.specialMoves()).includes(move) && move != "timeout") {
      const decoded_move = Coordinate.fromSgfRepr(move);
      const occupants = this.board.at(decoded_move);
      if (occupants === undefined) {
        throw Error(
          `Move out of bounds. (move: ${decoded_move}, board dimensions: ${this.board.width}x${this.board.height}`,
        );
      }
      if (occupants.length !== 0) {
        throw new Error("Can't play on existing stone.");
      }
    }

    if (move === "resign" || move === "timeout") {
      this.playerParticipation[player].dropOutAtRound = this.round;

      if (this.nextToPlay().length < 2) {
        if (this.nextToPlay().length === 1) {
          this.result = `Player ${this.nextToPlay()[0]} wins!`;
        }

        this.phase = "gameover";
        return;
      }
    } else {
      // stage move

      if (!this.nextToPlay().includes(player)) {
        throw new Error("Not your turn");
      }

      this.staged[player] = move;
    }

    if (this.nextToPlay().some((playerNr) => !(playerNr in this.staged))) {
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
    if (num_passes === this.nextToPlay().length) {
      this.phase = "gameover";
    }

    if (this.config.collision_handling === "pass") {
      this.replaceMultiColoredStonesWith([]);
    }
    if (this.config.collision_handling === "ko") {
      this.replaceMultiColoredStonesWith([-1]);
    }

    this.removeGroupsIf(
      ({ has_liberties, contains_staged }) =>
        !has_liberties && !contains_staged,
    );
    this.removeGroupsIf(({ has_liberties }) => !has_liberties);

    this.last_round = this.staged;
    this.staged = {};
    super.increaseRound();
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
      intersection.length > 1 ? [...arr] : intersection,
    );
  }

  defaultConfig(): ParallelGoConfig {
    return {
      width: 19,
      height: 19,
      num_players: 2,
      collision_handling: "merge",
    };
  }

  private getGroup(
    pos: Coordinate,
    color: number,
    checked: Grid<{ [color: number]: boolean }>,
  ): Group {
    if (this.isOutOfBounds(pos)) {
      return { stones: [], has_liberties: false, contains_staged: false };
    }
    const checked_at_pos = checked.at(pos)!;
    const board_at_pos = this.board.at(pos)!;
    let has_liberties = board_at_pos.length === 0;
    if (checked_at_pos[color]) {
      return { stones: [], has_liberties, contains_staged: false };
    }
    checked_at_pos[color] = true;

    const stones: Coordinate[] = [];

    let contains_staged =
      this.staged[color] !== undefined &&
      Coordinate.fromSgfRepr(this.staged[color]).equals(pos);

    if (board_at_pos.includes(color)) {
      stones.push(pos);
      this.forEachNeighbor(pos, (neighbor) => {
        const group = this.getGroup(neighbor, color, checked);
        stones.push(...group.stones);
        has_liberties = has_liberties || group.has_liberties;
        contains_staged = contains_staged || group.contains_staged;
      });
    }

    return {
      stones,
      has_liberties,
      contains_staged,
    };
  }

  private forEachNeighbor(pos: Coordinate, f: (pos: Coordinate) => void): void {
    f(new Coordinate(pos.x - 1, pos.y));
    f(new Coordinate(pos.x + 1, pos.y));
    f(new Coordinate(pos.x, pos.y - 1));
    f(new Coordinate(pos.x, pos.y + 1));
  }

  private isOutOfBounds(pos: Coordinate) {
    return (
      pos.x < 0 ||
      pos.y < 0 ||
      pos.x >= this.board.width ||
      pos.y >= this.board.height
    );
  }

  private removeGroupsIf(predicate: (group: Group) => boolean) {
    const checked: Grid<{ [color: number]: boolean }> = this.board.map(() => {
      return {};
    });
    const groups: Group[] = [];

    this.board.forEach((colors, pos) => {
      colors.forEach((color) => {
        let group: Group | undefined = undefined;
        group = this.getGroup(pos, color, checked);

        if (group?.stones.length) {
          groups.push(group);
        }
      });
    });

    groups.forEach((group) => {
      if (!predicate(group)) {
        return;
      }
      group.stones.forEach((pos) => this.board.set(pos, []));
    });
  }

  initializeParticipation(numPlayers: number): Participation[] {
    const participation = new Array(numPlayers);
    for (let i = 0; i < numPlayers; i++) {
      participation[i] = { playerNr: i, dropOutAtRound: null };
    }
    return participation;
  }

  getSGF(): string{
    return '';
  }
}

interface Group {
  stones: Coordinate[];
  has_liberties: boolean;
  contains_staged: boolean;
}
