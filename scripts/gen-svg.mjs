import fs from 'fs';
import path from 'path';
import { transform } from '@svgr/core';
import jsx from '@svgr/plugin-jsx';
import svgo from '@svgr/plugin-svgo';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAW_SVG_DIR = path.resolve(__dirname, '../app/assets/svg');
const OUT_SVG_DIR = path.resolve(__dirname, '../app/assets/svg-component');

function toPascalCase(name) {
  return name
    .replace(/\.svg$/, '')
    .split(/[_-]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

// 🔧 Tạo thư mục đầu ra nếu chưa có
if (!fs.existsSync(OUT_SVG_DIR)) {
  fs.mkdirSync(OUT_SVG_DIR, { recursive: true });
}

const svgFiles = fs.readdirSync(RAW_SVG_DIR).filter((f) => f.endsWith('.svg'));
const newExportStatements = [];
const newComponentNames = [];

(async () => {
  for (const file of svgFiles) {
    const filePath = path.join(RAW_SVG_DIR, file);
    const componentName = toPascalCase(file);
    const outputPath = path.join(OUT_SVG_DIR, `${componentName}.tsx`);

    // ⏭️ Skip if the .tsx file already exists
    if (fs.existsSync(outputPath)) {
      console.log(`⏭️  Skipped (already exists): ${componentName}.tsx`);
      continue;
    }

    const svgCode = fs.readFileSync(filePath, 'utf8');

    try {
      const tsxCode = await transform(
        svgCode,
        {
          typescript: true,
          native: true,
          icon: true,
          expandProps: true,
          prettier: true,
          plugins: [svgo, jsx],
          svgoConfig: {
            plugins: [
              {
                name: 'removeAttrs',
                params: {
                  attrs: [
                    'xmlns:*',
                    'sketch:*',
                    '*:sketch',
                    '*:type',
                  ],
                },
              },
              { name: 'cleanupAttrs', active: true },
              {
                name: 'removeElementsByAttr',
                params: {
                  id: [
                    'SVGRepo_bgCarrier',
                    'SVGRepo_tracerCarrier',
                    'SVGRepo_iconCarrier',
                  ],
                },
              },
              { name: 'removeUnknownsAndDefaults', active: true },
              { name: 'removeXMLNS', active: true },
            ],
          },
        },
        { componentName }
      );

      const patchedCode = tsxCode
        // Remove leftover xmlns/sketch attributes (if any)
        .replace(/xmlns[^=]*="[^"]*"/g, '')
        .replace(/sketch:[^=]*="[^"]*"/g, '')
        .replace(/[^a-z]xmlnsXlink="[^"]*"/g, '')
        .replace(/[^a-z]xmlns="[^"]*"/g, '')
        .replace(/[^a-z]sketch:type="[^"]*"/g, '')
        // Patch fill colors
        .replace(
          /fill=(["'])(#[0-9a-fA-F]{3,6})\1/g,
          (_, __, color) => `fill={props.color ?? '${color}'}`
        );

      fs.writeFileSync(outputPath, patchedCode, 'utf8');
      console.log(`✅ ${file} → ${componentName}.tsx`);
      newExportStatements.push(`import ${componentName} from './${componentName}';`);
      newComponentNames.push(componentName);
    } catch (err) {
      console.error(`❌ Failed to convert ${file}:`, err);
    }
  }

  // 📦 Merge new entries into index.ts (only add, never remove)
  const indexPath = path.join(OUT_SVG_DIR, 'index.ts');

  if (newComponentNames.length === 0) {
    console.log(`✅ No new SVGs to add. index.ts is unchanged.`);
    return;
  }

  let existingContent = '';
  if (fs.existsSync(indexPath)) {
    existingContent = fs.readFileSync(indexPath, 'utf8');
  }

  // Parse existing imports and export entries from index.ts
  const existingImportLines = existingContent.match(/^import .+ from '.+';$/gm) || [];
  const existingExportMatch = existingContent.match(/export const SvgIcons = \{([\s\S]*?)\};/);
  const existingExportEntries = existingExportMatch
    ? existingExportMatch[1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // Merge: add only new imports and exports
  const allImports = [...existingImportLines, ...newExportStatements];
  const allExportEntries = [...new Set([...existingExportEntries, ...newComponentNames])];

  const mergedContent = `${allImports.join('\n')}\n\nexport const SvgIcons = {\n  ${allExportEntries.join(',\n  ')},\n};\n`;

  fs.writeFileSync(indexPath, mergedContent, 'utf8');
  console.log(`📦 Updated index.ts with ${newComponentNames.length} new component(s): ${newComponentNames.join(', ')}`);
})();
