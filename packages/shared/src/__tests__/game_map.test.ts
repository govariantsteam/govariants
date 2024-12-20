import {
  getDefaultConfig,
  getDescription,
  getVariantList,
  makeGameObject,
  sanitizeConfig,
  supportsSGF,
} from "../variant_map";

test.each(getVariantList())("Build %s from default config", (variant) => {
  const default_config = getDefaultConfig(variant);

  // This is a dummy expectation
  // This test is basically a success if neither function call throws an error
  expect(makeGameObject(variant, default_config)).toBeDefined();
});

test("invalid variants", () => {
  const variant = "invalid_variant";
  const config = { foo: "bar " };
  expect(getDescription(variant)).toBe("");
  expect(supportsSGF(variant)).toBe(false);
  expect(sanitizeConfig(variant, config)).toEqual(config);
});

test("deprecated field contains baduk", () => {
  const list = getVariantList();
  // We will probably never deprecate baduk lol
  expect(list).toContain("baduk");
});
