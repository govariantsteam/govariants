import { AbstractGame, MovesType } from "../abstract_game";
import { Grid } from "../grid";

type WhitePiece = "p" | "r" | "n" | "b" | "q" | "k";
type BlackPiece = Uppercase<WhitePiece>;
type Piece = WhitePiece | BlackPiece;
type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type File = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
type Square = `${File}${Rank}`;

// Not exactly FEN, but concepts and notations borrowed
export interface ChessState {
  board: Array<Array<Piece | null>>;
  en_passant_target: Square | null;
  castling_rights: { K: boolean; Q: boolean; k: boolean; q: boolean };
}

const EMPTY_ROW = [null, null, null, null, null, null, null, null];
const STARTING_BOARD: Array<Array<Piece | null>> = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  EMPTY_ROW,
  EMPTY_ROW,
  EMPTY_ROW,
  EMPTY_ROW,
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"],
];

export class Chess extends AbstractGame<object, ChessState> {
  private board = Grid.from2DArray(STARTING_BOARD);
  private active_color: 0 | 1 = 0;
  private en_passant_target: Square | null = null;
  private castling_rights = { K: true, Q: true, k: true, q: true };
  private halfmove_clock = 0;

  playMove(move: MovesType): void {
    throw new Error("Method not implemented.");
  }

  exportState(): ChessState {
    throw new Error("Method not implemented.");
  }
  nextToPlay(): number[] {
    throw new Error("Method not implemented.");
  }
  numPlayers(): number {
    throw new Error("Method not implemented.");
  }
  defaultConfig(): object {
    throw new Error("Method not implemented.");
  }
}
