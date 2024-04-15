import { readFileSync, writeFileSync } from "fs";
import nunjucks from "nunjucks";
import path from "path";

/* global console */
/* global process */

// Function to replace templates
function replaceTemplates(sourcePath, targetPath) {
  // Read the source file
  let content = readFileSync(sourcePath, "utf-8");

  // Use Nunjucks to render the template
  content = nunjucks.renderString(content, {
    /* your variables here */
  });

  // Write the rendered content to the target file
  writeFileSync(targetPath, content);
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
replaceTemplates(sourceFileTemplate, sourceFileOutput);
replaceTemplates(testFileTemplate, testFileOutput);

console.log("Directory copied and templates replaced successfully.");
