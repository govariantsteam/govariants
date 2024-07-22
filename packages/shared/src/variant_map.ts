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
import { deprecated_variants } from "./deprecated_variants";
import { Variant } from "./variant";

const variant_map: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [variant: string]: Variant;
} = {
  baduk: { gameClass: Baduk },
  badukWithAbstractBoard: { gameClass: BadukWithAbstractBoard },
  phantom: { gameClass: Phantom },
  parallel: { gameClass: ParallelGo },
  capture: { gameClass: Capture },
  chess: { gameClass: ChessGame },
  tetris: { gameClass: TetrisGo },
  pyramid: { gameClass: PyramidGo },
  "thue-morse": { gameClass: ThueMorse },
  freeze: { gameClass: FreezeGo },
  fractional: { gameClass: Fractional },
  keima: { gameClass: Keima },
  "one color": { gameClass: OneColorGo },
  drift: { gameClass: DriftGo },
  quantum: { gameClass: QuantumGo },
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
  return Object.keys(variant_map).filter(
    (variant) => !deprecated_variants.includes(variant),
  );
}

export function getDefaultConfig(variant: string) {
  // TODO: move the default config into Variant since it is a "static" method
  const game = makeGameObject(variant, undefined);
  return game.defaultConfig();
}

export function supportsSGF(variant: string) {
  return variant_map[variant]?.gameClass.prototype.getSGF;
}
