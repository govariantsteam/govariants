import { AbstractGame, GamePhase, MovesType } from "../abstract_game";

enum Color {
  EMPTY = 0,
  BLACK = 1,
  WHITE = 2,
}

export interface BadukConfig {
  width?: number;
  height?: number;
}

export interface BadukState {
  board: Color[][];
  next_to_play: 0 | 1;
  captures: { 0: number; 1: number };
}

interface Coordinate {
  readonly x: number;
  readonly y: number;
}

type BadukMovesType = {
  [player in 0 | 1]: string;
};

export class Baduk extends AbstractGame<BadukState> {
  private board: Color[][];
  private next_to_play: 0 | 1 = 0;
  private captures = { 0: 0, 1: 0 };
  private last_move = "";

  constructor(config: BadukConfig) {
    super();
    this.board = makeEmptyBoard(config.width ?? 19, config.height ?? 19);
  }

  exportState(): BadukState {
    return {
      board: copyBoard(this.board),
      captures: { 0: this.captures[0], 1: this.captures[1] },
      next_to_play: this.next_to_play,
    };
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
        this.phase = "scoring";
      } else {
        this.last_move = move;
      }
      return;
    }

    const decoded_move = decodeMove(move);
    if (this.board[decoded_move.y][decoded_move.x] != Color.EMPTY) {
      throw Error("Cannot place a stone on top of an existing stone.");
    }
    const player_color = player === 0 ? Color.BLACK : Color.WHITE;
    const opponent_color = player === 0 ? Color.WHITE : Color.BLACK;
    const new_board = copyBoard(this.board);
    new_board[decoded_move.y][decoded_move.x] = player_color;

    // Capture any opponent groups
    neighboringPositions(decoded_move).forEach((pos) => {
      if (
        new_board[pos.y][pos.x] === opponent_color &&
        !groupHasLiberties(pos, new_board)
      ) {
        this.captures[player] += removeGroup(pos, this.board);
      }
    });

    // Detect suicide
    if (!groupHasLiberties(decoded_move, this.board)) {
      throw Error("Move is suicidal!");
    }

    this.last_move = move;
  }

  numPlayers(): number {
    return 2;
  }
}

function makeEmptyBoard(width: number, height: number): Color[][] {
  return makeGridWithValue(width, height, Color.EMPTY);
}

function makeGridWithValue<T>(width: number, height: number, value: T): T[][] {
  return new Array(height).fill(new Array(width).fill(value));
}

function copyBoard(board: Color[][]) {
  return board.map((row) => [...row]);
}

function decodeMove(move: string): Coordinate {
  return { x: decodeChar(move[0]), y: decodeChar(move[1]) };
}

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
  const color = board[pos.x][pos.y];
  const width = board[0].length;
  const height = board.length;
  const visited = makeGridWithValue(width, height, false);

  function helper({ x, y }: Coordinate): boolean {
    if (board[x][y] === Color.EMPTY) {
      // found a liberty
      return true;
    }
    if (color !== board[x][y]) {
      // Either opponent color or undefined (out of bounds)
      return false;
    }
    if (visited[x][y]) {
      // Already seen
      return false;
    }
    visited[x][y] = true;
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
  const color = board[pos.x][pos.y];

  function helper({ x, y }: Coordinate): number {
    if (color !== board[x][y]) {
      return 0;
    }

    board[x][y] = Color.EMPTY;

    return neighboringPositions({ x, y })
      .map(helper)
      .reduce((acc, val) => acc + val, 1);
  }

  return helper(pos);
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
