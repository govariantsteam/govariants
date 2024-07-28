import { readFileSync, writeFileSync } from "fs";
import nunjucks from "nunjucks";
import path from "path";

/* global console */
/* global process */

// Function to replace templates
function replaceTemplates(sourcePath, targetPath, variantName) {
  // Read the source file
  let content = readFileSync(sourcePath, "utf-8");

  // Use Nunjucks to render the template
  content = nunjucks.renderString(content, {
    namePascal: snakeToPascal(variantName),
    nameSnake: variantName,
    nameCamel: snakeToCamel(variantName),
  });

  // Write the rendered content to the target file
  writeFileSync(targetPath, content);
}

// convert snake_case string to PascalCase
function snakeToPascal(snakeCase) {
  // Split the string into an array of words
  const words = snakeCase.split("_");

  // Capitalize the first letter of each word
  const pascalWords = words.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  );

  // Join the words back together
  return pascalWords.join("");
}

// convert snake_case string to camelCase
function snakeToCamel(snakeCase) {
  // Split the string into an array of words
  const words = snakeCase.split("_");

  // Capitalize the first letter of each word
  const capitalizedWords = words.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  );

  return [words[0], ...capitalizedWords.slice(1)].join("");
}

// Get the variant name
if (process.argv.length !== 3) {
  console.log("Usage: node create-new-variant.mjs [variant name]");
  process.exit(1);
}
const variantName = process.argv[2];
if (!/^[a-z_]*$/.test(variantName)) {
  console.error(
    "Please use snake_case (only lower case letters and underscores)",
  );
  process.exit(1);
}

// Define source and target directories
const variantsDir = path.join(process.cwd(), "src/variants");
const sourceFileTemplate = path.join(variantsDir, "template/variant.ts.njk");
const sourceFileOutput = path.join(variantsDir, `${variantName}.ts`);
const testFileTemplate = path.join(variantsDir, "template/variant.test.ts.njk");
const testFileOutput = path.join(
  variantsDir,
  `__tests__/${variantName}.test.ts`,
);

// Call the copy directory function
replaceTemplates(sourceFileTemplate, sourceFileOutput, variantName);
replaceTemplates(testFileTemplate, testFileOutput, variantName);

console.log("Directory copied and templates replaced successfully.");
