import { Baduk, BadukConfig } from "../baduk";
import { BoardConfig } from "../../lib/abstractBoard/boardFactory";
import { Variant } from "../../variant";

export enum BoardPattern {
  Unknown = 0,
  Rectangular = 1,
  Polygonal = 2,
  Circular = 3,
  Trihexagonal = 4,
  Sierpinsky = 5,
}

export interface BadukWithAbstractBoardConfig {
  width: number;
  height: number;
  komi: number;
  pattern: BoardPattern;
}

function mapToNewBoardConfig(
  config: BadukWithAbstractBoardConfig,
): BoardConfig {
  switch (config.pattern) {
    case BoardPattern.Rectangular: {
      return { type: "grid", width: config.width, height: config.height };
    }
    case BoardPattern.Polygonal: {
      return { type: "polygonal", size: config.width };
    }
    case BoardPattern.Circular: {
      return {
        type: "circular",
        rings: config.height,
        nodesPerRing: config.width,
      };
    }
    case BoardPattern.Trihexagonal: {
      return { type: "trihexagonal", size: config.width };
    }
    case BoardPattern.Sierpinsky: {
      return { type: "sierpinsky", size: config.width };
    }
  }
  // default return
  return { type: "grid", width: 19, height: 19 };
}

export function mapToNewBadukConfig(
  config: BadukWithAbstractBoardConfig,
): BadukConfig {
  return { komi: config.komi, board: mapToNewBoardConfig(config) };
}

export class BadukWithAbstractBoard extends Baduk {
  constructor(config?: BadukWithAbstractBoardConfig) {
    const mapped_config =
      config === undefined ? undefined : mapToNewBadukConfig(config);
    super(mapped_config);
  }
}

export const badukWithAbstractBoardVariant: Variant<BadukWithAbstractBoardConfig> =
  {
    gameClass: BadukWithAbstractBoard,
    description: "Baduk with varying board patterns",
    deprecated: true,
  };