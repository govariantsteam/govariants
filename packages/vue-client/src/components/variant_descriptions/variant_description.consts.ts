export const badukDescriptionShort =
  "Traditional game of Baduk a.k.a. Go, Weiqi\n Surround stones to capture them\n Secure more territory + captures to win";
export const badukWithAbstractBoardDescriptionShort =
  "Baduk with varying board patterns";
export const phantomDescriptionShort =
  "Baduk but other players stones are invisible";
export const parallelDescriptionShort = "Multiplayer Baduk with parallel moves";
export const captureDescriptionShort =
  "Baduk but the first player who captures a stone wins";
export const chessDescriptionShort =
  "Baduk with different types of stones\n the goal is to capture a specific stone";
export const tetrisDescriptionShort =
  "Baduk but players can't play Tetris shapes";
export const pyramidDescriptionShort =
  "Baduk with pyramid scoring\n Center is worth most points, edge the least";
export const thueMorseDescriptionShort =
  "Baduk with move order according to thue-morse sequence";
export const freezeDescriptionShort =
  "Baduk but after an Atari, stones can't be captured";
export const fractionalDescriptionShort =
  "Multiplayer Baduk with multicolored stones and parallel moves";
export const keimaDescriptionShort =
  "Baduk but players must play Keima (Knight's move) shapes";
export const oneColorDescriptionShort = "Baduk with obfuscated stone colors";

export const variant_short_description_map: { [variant: string]: string } = {
  baduk: badukDescriptionShort,
  badukWithAbstractBoard: badukWithAbstractBoardDescriptionShort,
  phantom: phantomDescriptionShort,
  parallel: parallelDescriptionShort,
  capture: captureDescriptionShort,
  chess: chessDescriptionShort,
  tetris: tetrisDescriptionShort,
  pyramid: pyramidDescriptionShort,
  "thue-morse": thueMorseDescriptionShort,
  freeze: freezeDescriptionShort,
  fractional: fractionalDescriptionShort,
  keima: keimaDescriptionShort,
  "one color": oneColorDescriptionShort,
};
