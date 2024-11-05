import { Baduk, BadukConfig } from "../baduk";
import { BoardConfig } from "../../lib/abstractBoard/boardFactory";
import { Variant } from "../../variant";
import { NewBadukConfig } from "../baduk_utils";

enum BoardPattern {
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

export function mapToNewBadukConfig(config: unknown): NewBadukConfig {
  const typedConfig = config as BadukWithAbstractBoardConfig;
  return { komi: typedConfig.komi, board: mapToNewBoardConfig(typedConfig) };
}

export const badukWithAbstractBoardVariant: Variant<BadukConfig> = {
  gameClass: Baduk,
  description: "Baduk with varying board patterns",
  deprecated: true,
  sanitizeConfig: mapToNewBadukConfig,
  defaultConfig() {
    return {
      width: 19,
      height: 19,
      komi: 6.5,
      pattern: BoardPattern.Rectangular,
    };
  },
  getPlayerColors: Baduk.getPlayerColors,
};
