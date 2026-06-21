// import fs from "fs";
// import path from "path";
const fs = require('fs');
const path = require('path');

const assetsConfig = [
  {
    pathFolder: path.resolve("../spotify/app/assets/image"),
    assetName: "image",
  },
];

const REGEX_EXTENSION_ASSET = /\.(svg|png|apng|jpg|jpeg|webp|json|rive|gif|ttf)$/i;

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

  const filesName = fs.readdirSync(pathFolder);
  let importStatements = "";
  let exportContent = "";

  filesName.forEach((file) => {
    if (!/@\dx/i.test(file) && REGEX_EXTENSION_ASSET.test(file)) {
      const fileNameWithoutExt = file.replace(REGEX_EXTENSION_ASSET, "");
      const variableName =
        fileNameWithoutExt.charAt(0).toLowerCase() +
        fileNameWithoutExt.slice(1);

      // Tạo câu lệnh import
      importStatements += `import ${capitalize(
        variableName
      )} from "./${file}";\n`;

      // Thêm vào nội dung export
      exportContent += `  ${capitalize(variableName)},\n`;
    }
  });

  if (!importStatements || !exportContent) {
    console.log(`⚠️ No valid assets found in: ${pathFolder}`);
    return;
  }

  // Nội dung của file index.ts
  const fileContent = `${importStatements}\nexport const ${assetName} = {\n${exportContent}};\n`;

  const indexPath = path.join(pathFolder, "index.ts");

  // Kiểm tra nếu nội dung không thay đổi
  if (fs.existsSync(indexPath)) {
    const currentContent = fs.readFileSync(indexPath, "utf8");
    if (currentContent === fileContent) {
      console.log(`✅ No changes detected for: ${indexPath}`);
      return;
    }
  }

  // Ghi file mới
  fs.writeFileSync(indexPath, fileContent);
  console.log(`✅ Generated: ${indexPath}`);
}

// Xử lý từng cấu hình asset
assetsConfig.forEach(generateIndexFile);
