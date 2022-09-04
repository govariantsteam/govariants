import { AbstractGame, MovesType } from "../abstract_game";

export enum Color {
  EMPTY = 0,
  BLACK = 1,
  WHITE = 2,
}

export interface BadukConfig {
  width: number;
  height: number;
  komi: number;
}

export interface BadukState {
  board: Color[][];
  next_to_play: 0 | 1;
  captures: { 0: number; 1: number };
  last_move: string;
}

interface Coordinate {
  readonly x: number;
  readonly y: number;
}

type BadukMovesType = { 0: string } | { 1: string };

export class Baduk extends AbstractGame<BadukConfig, BadukState> {
  private board: Color[][];
  private next_to_play: 0 | 1 = 0;
  private captures = { 0: 0, 1: 0 };
  private last_move = "";

  constructor(config: BadukConfig) {
    super(config);
    this.board = makeEmptyBoard(config.width, config.height);
  }

  exportState(): BadukState {
    return {
      board: copyBoard(this.board),
      captures: { 0: this.captures[0], 1: this.captures[1] },
      next_to_play: this.next_to_play,
      last_move: this.last_move,
    };
  }

  importState(state: BadukState) {
    this.board = copyBoard(state.board);
    this.captures = { 0: state.captures[0], 1: state.captures[1] };
    this.next_to_play = state.next_to_play;
    this.last_move = state.last_move;
  }

  nextToPlay(): number[] {
    return [this.next_to_play];
  }

  playMove(moves: BadukMovesType): void {
    const { player, move } = getOnlyMove(moves);
    if (player != this.next_to_play) {
      throw Error(`It's not player ${player}'s turn!`);
    }
    this.next_to_play = this.next_to_play === 0 ? 1 : 0;

    if (move == "pass") {
      if (this.last_move === "pass") {
        this.finalizeScore();
      } else {
        this.last_move = move;
      }
      return;
    }

    if (move === "resign") {
      this.phase = "gameover";
      this.result = this.next_to_play === 0 ? "B+R" : "W+R";
      return;
    }

    const decoded_move = decodeMove(move);
    const { x, y } = decoded_move;
    if (isOutOfBounds(decoded_move, this.board)) {
      throw Error(
        `Move out of bounds. (move: ${decoded_move}, board dimensions: ${this.config.width}x${this.config.height}`
      );
    }
    if (this.board[y][x] != Color.EMPTY) {
      throw Error(
        `Cannot place a stone on top of an existing stone. (${this.board[y][x]} at (${x}, ${y}))`
      );
    }
    const player_color = player === 0 ? Color.BLACK : Color.WHITE;
    const opponent_color = player === 0 ? Color.WHITE : Color.BLACK;
    this.board[y][x] = player_color;

    // Capture any opponent groups
    neighboringPositions(decoded_move).forEach((pos) => {
      if (isOutOfBounds(pos, this.board)) {
        return;
      }
      if (
        this.board[pos.y][pos.x] === opponent_color &&
        !groupHasLiberties(pos, this.board)
      ) {
        this.captures[player] += removeGroup(pos, this.board);
      }
    });

    // Detect suicide
    if (!groupHasLiberties(decoded_move, this.board)) {
      console.log(this.board);
      throw Error("Move is suicidal!");
    }

    this.last_move = move;
  }

  numPlayers(): number {
    return 2;
  }

  private finalizeScore(): void {
    const board = copyBoard(this.board);
    const visited = makeGridWithValue(
      this.config.width,
      this.config.height,
      false
    );

    const determineController = (pos: Coordinate): Color => {
      if (isOutOfBounds(pos, board)) {
        return Color.EMPTY;
      }
      if (board[pos.y][pos.x] !== Color.EMPTY) {
        return board[pos.y][pos.x];
      }
      if (visited[pos.y][pos.x]) {
        return Color.EMPTY;
      }
      visited[pos.y][pos.x] = true;
      const neighbor_results =
        neighboringPositions(pos).map(determineController);
      const saw_white = neighbor_results.includes(Color.WHITE);
      const saw_black = neighbor_results.includes(Color.BLACK);
      if (saw_black && saw_white) {
        return Color.EMPTY;
      }
      if (saw_black) {
        return Color.BLACK;
      }

      if (saw_white) {
        return Color.WHITE;
      }
      return Color.EMPTY;
    };

    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        if (visited[y][x]) {
          continue;
        }
        if (board[y][x] === Color.EMPTY) {
          const controller = determineController({ x, y });
          floodFill({ x, y }, controller, board);
        }
      }
    }

    const black_points: number = countValueIn2dArray(Color.BLACK, board);
    const white_points: number =
      countValueIn2dArray(Color.WHITE, board) + this.config.komi;
    const diff = black_points - white_points;
    if (diff < 0) {
      this.result = `W+${-diff}`;
    } else if (diff > 0) {
      this.result = `B+${diff}`;
    } else {
      this.result = "Tie";
    }

    this.phase = "gameover";
  }

  specialMoves() {
    return { pass: "Pass", resign: "Resign" };
  }
}

function makeEmptyBoard(width: number, height: number): Color[][] {
  return makeGridWithValue(width, height, Color.EMPTY);
}

function makeGridWithValue<T>(width: number, height: number, value: T): T[][] {
  return new Array(height).fill(null).map(() => new Array(width).fill(value));
}

function copyBoard(board: Color[][]) {
  return board.map((row) => [...row]);
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

/** Returns true if the group containing (x, y) has at least one liberty. */
function groupHasLiberties(pos: Coordinate, board: Color[][]) {
  const color = board[pos.y][pos.x];
  const width = board[0].length;
  const height = board.length;
  const visited = makeGridWithValue(width, height, false);

  function helper({ x, y }: Coordinate): boolean {
    if (isOutOfBounds({ x, y }, board)) {
      return false;
    }

    if (board[y][x] === Color.EMPTY) {
      // found a liberty
      return true;
    }
    if (color !== board[y][x]) {
      // opponent color
      return false;
    }
    if (visited[y][x]) {
      // Already seen
      return false;
    }
    visited[y][x] = true;
    return neighboringPositions({ x, y }).some(helper);
  }

  return helper(pos);
}

function neighboringPositions({ x, y }: Coordinate) {
  return [
    { x: x - 1, y },
    { x: x + 1, y },
    { x, y: y - 1 },
    { x, y: y + 1 },
  ] as const;
}

/**
 * Removes the group containing pos, and returns the number of stones removed
 * from the board.
 */
function removeGroup(pos: Coordinate, board: Color[][]): number {
  return floodFill(pos, Color.EMPTY, board);
}

/** Asserts there is exaclty one move, and returns it */
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

function isOutOfBounds({ x, y }: Coordinate, board: Color[][]): boolean {
  return board[y] === undefined || board[y][x] === undefined;
}

/** Fills area with the given color, and returns the number of spaces filled. */
function floodFill(
  pos: Coordinate,
  target_color: Color,
  board: Color[][]
): number {
  const starting_color = board[pos.y][pos.x];
  if (starting_color === target_color) {
    return 0;
  }

  function helper({ x, y }: Coordinate): number {
    if (isOutOfBounds({ x, y }, board)) {
      return 0;
    }

    if (starting_color !== board[y][x]) {
      return 0;
    }

    board[y][x] = target_color;

    return neighboringPositions({ x, y })
      .map(helper)
      .reduce((acc, val) => acc + val, 1);
  }

  return helper(pos);
}

/** Returns the number of occurrences for the given color */
function countValueIn2dArray<T>(value: T, array: T[][]) {
  return array.flat().filter((val) => val === value).length;
}
