import { getDefaultConfig, getVariantList, makeGameObject } from "../game_map";

test.each(getVariantList())("Build %s from default config", (variant) => {
  const default_config = getDefaultConfig(variant);

  // This is a dummy expectation
  // This test is basically a success if neither function call throws an error
  expect(makeGameObject(variant, default_config)).toBeDefined();
});
