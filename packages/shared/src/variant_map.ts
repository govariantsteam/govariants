import { AbstractGame } from "./abstract_game";
import { BadukWithAbstractBoard } from "./variants/badukWithAbstractBoard";
import { Phantom } from "./variants/phantom";
import { ParallelGo } from "./variants/parallel";
import { Capture } from "./variants/capture";
import { ChessGame } from "./variants/chess";
import { TetrisGo } from "./variants/tetris";
import { PyramidGo } from "./variants/pyramid";
import { ThueMorse } from "./variants/thue_morse";
import { FreezeGo } from "./variants/freeze";
import { Fractional } from "./variants/fractional";
import { Keima } from "./variants/keima";
import { OneColorGo } from "./variants/one_color";
import { DriftGo } from "./variants/drift";
import { QuantumGo } from "./variants/quantum";
import { Baduk } from "./variants/baduk";
import { Variant } from "./variant";

const variant_map: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [variant: string]: Variant;
} = {
  baduk: {
    gameClass: Baduk,
    description:
      "Traditional game of Baduk a.k.a. Go, Weiqi\n Surround stones to capture them\n Secure more territory + captures to win",
  },
  badukWithAbstractBoard: {
    gameClass: BadukWithAbstractBoard,
    description: "Baduk with varying board patterns",
    deprecated: true,
  },
  phantom: {
    gameClass: Phantom,
    description: "Baduk but other players stones are invisible",
  },
  parallel: {
    gameClass: ParallelGo,
    description: "Multiplayer Baduk with parallel moves",
  },
  capture: {
    gameClass: Capture,
    description: "Baduk but the first player who captures a stone wins",
  },
  chess: {
    gameClass: ChessGame,
    description:
      "Baduk with different types of stones\n the goal is to capture a specific stone",
  },
  tetris: {
    gameClass: TetrisGo,
    description: "Baduk but players can't play Tetris shapes",
  },
  pyramid: {
    gameClass: PyramidGo,
    description:
      "Baduk with pyramid scoring\n Center is worth most points, edge the least",
  },
  "thue-morse": {
    gameClass: ThueMorse,
    description: "Baduk with move order according to Thue-Morse sequence",
  },
  freeze: {
    gameClass: FreezeGo,
    description: "Baduk but after an Atari, stones can't be captured",
  },
  fractional: {
    gameClass: Fractional,
    description:
      "Multiplayer Baduk with multicolored stones and parallel moves",
  },
  keima: {
    gameClass: Keima,
    description:
      "Baduk but players play two moves that must form a Keima (Knight's move) shape",
  },
  "one color": {
    gameClass: OneColorGo,
    description: "Baduk with obfuscated stone colors",
  },
  drift: {
    gameClass: DriftGo,
    description: "Baduk, but the entire board drifts on every turn",
  },
  quantum: {
    gameClass: QuantumGo,
    description: "Two boards whose stones are entangled",
  },
};

class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export function makeGameObject(
  variant: string,
  config: unknown,
): AbstractGame<object, object> {
  try {
    return new variant_map[variant].gameClass(config);
  } catch (e) {
    throw new ConfigError(
      `${e}, (variant: ${variant}, config: ${JSON.stringify(config)})`,
    );
  }
}

export function getVariantList(): string[] {
  return Object.entries(variant_map)
    .filter(([_name, variant]) => !variant.deprecated)
    .map(([name, _variant]) => name);
}

export function getDefaultConfig(variant: string) {
  // TODO: move the default config into Variant since it is a "static" method
  const game = makeGameObject(variant, undefined);
  return game.defaultConfig();
}

export function supportsSGF(variant: string) {
  return Boolean(variant_map[variant]?.gameClass.prototype.getSGF);
}

export function getDescription(variant: string) {
  return variant_map[variant]?.description ?? "";
}
