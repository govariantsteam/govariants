export interface MulticolorStone {
  colors: string[];
  annotation?: "CR" | "MA";
}

export interface UnicolorStone {
  color: string;
  annotation?: "CR" | "MA";
}
