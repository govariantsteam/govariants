export interface CoordinateLike {
  x: number;
  y: number;
}

export class Coordinate implements CoordinateLike {
  constructor(public readonly x: number, public readonly y: number) {}

  toSgfRepr(): string {
    return numberToSgfChar(this.x) + numberToSgfChar(this.y);
  }

  static fromSgfRepr(move: string) {
    return new Coordinate(decodeChar(move[0]), decodeChar(move[1]));
  }

  equals(other: Coordinate) {
    return this.x === other.x && this.y === other.y;
  }
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

const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function numberToSgfChar(n: number): string {
  const ret = ALPHABET[n];
  if (!ret) {
    throw new Error(`Could not convert numeric coordinate to char: ${n}`);
  }
  return ret;
}
