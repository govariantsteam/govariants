import { AbstractGame } from "./abstract_game";
import { badukWithAbstractBoardVariant } from "./variants/deprecated/badukWithAbstractBoard";
import { phantomVariant } from "./variants/phantom";
import { parallelVariant } from "./variants/parallel";
import { captureVariant } from "./variants/capture";
import { chessVariant } from "./variants/chess";
import { tetrisVariant } from "./variants/tetris";
import { pyramidVariant } from "./variants/pyramid";
import { thueMorseVariant } from "./variants/thue_morse";
import { freezeGoVariant } from "./variants/freeze";
import { fractionalVariant } from "./variants/fractional";
import { keimaVariant } from "./variants/keima";
import { oneColorGoVariant } from "./variants/one_color";
import { driftVariant } from "./variants/drift";
import { quantumVariant } from "./variants/quantum";
import { badukVariant } from "./variants/baduk";
import { Variant } from "./variant";
import markdownit from "markdown-it";
import { sFractionalVariant } from "./variants/s_fractional";
import { lighthouseVariant } from "./variants/lighthouse/lighthouse";

const variant_map: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [variant: string]: Variant<any, any>;
} = {
  baduk: badukVariant,
  badukWithAbstractBoard: badukWithAbstractBoardVariant,
  phantom: phantomVariant,
  parallel: parallelVariant,
  capture: captureVariant,
  chess: chessVariant,
  tetris: tetrisVariant,
  pyramid: pyramidVariant,
  "thue-morse": thueMorseVariant,
  freeze: freezeGoVariant,
  fractional: fractionalVariant,
  keima: keimaVariant,
  "one color": oneColorGoVariant,
  drift: driftVariant,
  quantum: quantumVariant,
  sfractional: sFractionalVariant,
  lighthouse: lighthouseVariant,
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

export function getDefaultConfig(variant: string): object {
  return variant_map[variant]?.defaultConfig();
}

export function sanitizeConfig(
  variant: string,
  config: object,
): object | undefined {
  const sanitize = variant_map[variant]?.sanitizeConfig;
  if (sanitize == null) {
    return config;
  }
  return sanitize(config);
}

export function supportsSGF(variant: string) {
  return Boolean(variant_map[variant]?.gameClass.prototype.getSGF);
}

export function getDescription(variant: string) {
  return variant_map[variant]?.description ?? "";
}

export function getRulesDescription(variant: string): string | undefined {
  const description = variant_map[variant]?.rulesDescription;
  if (description == null) {
    return "";
  }
  return markdownit("commonmark").render(description);
}

export function getPlayerColors(
  variant: string,
  config: object,
  playerNr: number,
): string[] {
  const variant_object = variant_map[variant];
  if (!variant_object || !variant_object.getPlayerColors) {
    return [];
  }
  return variant_object.getPlayerColors(config, playerNr);
}

export function uiTransform(variant: string, config: object, state: object) {
  const variant_object = variant_map[variant];
  if (!variant_object || !variant_object.uiTransform) {
    return { config, gamestate: state };
  }
  return variant_object.uiTransform(config, state);
}

export function getVariantsWithRulesDescription(): string[] {
  return Object.entries(variant_map)
    .filter(
      ([_name, variant]) =>
        !variant.deprecated && variant.rulesDescription !== undefined,
    )
    .map(([name, _variant]) => name);
}

export function getTimeHandling(
  variant: string,
): "sequential" | "parallel" | "none" {
  return variant_map[variant]?.time_handling ?? "none";
}
