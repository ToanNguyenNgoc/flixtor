// import fs from "fs";
// import path from "path";
const fs = require('fs');
const path = require('path');
const {transform} = require('@svgr/core');
const jsx = require('@svgr/plugin-jsx');
const svgo = require('@svgr/plugin-svgo');
const fileURLToPat = require('url')

const assetsConfig = [
  {
    pathFolder: path.resolve("../spotify/app/assets/svg"),
    assetName: "svg",
  },
];

const REGEX_EXTENSION_ASSET = /\.(svg|png|apng|jpg|jpeg|webp|json|rive|ttf)$/i;

/**
 * Hàm viết hoa ký tự đầu của mỗi từ
 * @param {string} text
 * @returns {string}
 */
function capitalize(text) {
  return text
    .trim()
    .split(/[-_\s]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

/**
 * Tạo file index.ts cho từng thư mục asset
 * @param {Object} assetConfig
 */
function generateIndexFile(assetConfig) {
  const { pathFolder, assetName } = assetConfig;

  if (!fs.existsSync(pathFolder)) {
    console.error(`❌ Folder not found: ${pathFolder}`);
    return;
  }

  const indexPath = path.join(pathFolder, "index.ts");

  // Parse existing index.ts to find already-imported files
  let existingContent = "";
  const existingImportedFiles = new Set();
  if (fs.existsSync(indexPath)) {
    existingContent = fs.readFileSync(indexPath, "utf8");
    // Match import statements like: import Foo from "./file.svg";
    const importRegex = /^import .+ from ["']\.\/(.+)["'];$/gm;
    let match;
    while ((match = importRegex.exec(existingContent)) !== null) {
      existingImportedFiles.add(match[1]);
    }
  }

  const filesName = fs.readdirSync(pathFolder);
  let newImportStatements = "";
  let newExportEntries = "";
  let newCount = 0;

  filesName.forEach((file) => {
    if (!/@\dx/i.test(file) && REGEX_EXTENSION_ASSET.test(file)) {
      // ⏭️ Skip files already imported in index.ts
      if (existingImportedFiles.has(file)) {
        return;
      }

      const fileNameWithoutExt = file.replace(REGEX_EXTENSION_ASSET, "");
      const variableName =
        fileNameWithoutExt.charAt(0).toLowerCase() +
        fileNameWithoutExt.slice(1);

      newImportStatements += `import ${capitalize(
        variableName
      )} from "./${file}";\n`;
      newExportEntries += `  ${capitalize(variableName)},\n`;
      newCount++;
    }
  });

  if (newCount === 0) {
    console.log(`✅ No new assets to add for: ${indexPath}`);
    return;
  }

  // Merge new entries into existing index.ts
  if (existingContent) {
    // Parse existing imports and export block
    const existingImportLines = existingContent.match(/^import .+ from ["'].+["'];$/gm) || [];
    const exportRegex = new RegExp(`export const ${assetName} = \\{([\\s\\S]*?)\\};`);
    const existingExportMatch = existingContent.match(exportRegex);
    const existingExportBlock = existingExportMatch ? existingExportMatch[1] : "";

    const allImports = existingImportLines.join("\n") + "\n" + newImportStatements;
    const allExports = existingExportBlock.trimEnd() + "\n" + newExportEntries;

    const mergedContent = `${allImports}\nexport const ${assetName} = {\n${allExports}};\n`;
    fs.writeFileSync(indexPath, mergedContent);
  } else {
    // No existing file, generate fresh
    const fileContent = `${newImportStatements}\nexport const ${assetName} = {\n${newExportEntries}};\n`;
    fs.writeFileSync(indexPath, fileContent);
  }

  console.log(`✅ Updated ${indexPath} with ${newCount} new asset(s)`);
}

// Xử lý từng cấu hình asset
assetsConfig.forEach(generateIndexFile);
