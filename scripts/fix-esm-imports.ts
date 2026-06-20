import * as fs from 'node:fs';
import * as path from 'node:path';

const RELATIVE_IMPORT_RE =
  /((?:import|export)\s+(?:[^'"]*?)\s*from\s*|import\s*\(\s*|export\s*\*\s+from\s*)(['"])([^'"]+)\2/g;

function hasExtension(specifier: string): boolean {
  const ext = path.extname(specifier);
  return ext !== '';
}

function normalizeSpecifier(specifier: string): string {
  // ESM allows both '..' and '../' to refer to the parent directory.
  return specifier === '..' ? '../' : specifier;
}

function resolveRelativeSpecifier(fileDir: string, specifier: string): string | undefined {
  const normalized = normalizeSpecifier(specifier);
  if (normalized.startsWith('./')) {
    const relativePath = normalized.slice(2);
    const asFile = path.join(fileDir, relativePath);
    if (fs.existsSync(asFile) && fs.statSync(asFile).isFile()) {
      return specifier;
    }
    const asJsFile = `${asFile}.js`;
    if (fs.existsSync(asJsFile) && fs.statSync(asJsFile).isFile()) {
      return `${specifier}.js`;
    }
    const asDir = asFile;
    if (fs.existsSync(asDir) && fs.statSync(asDir).isDirectory()) {
      const indexJs = path.join(asDir, 'index.js');
      if (fs.existsSync(indexJs) && fs.statSync(indexJs).isFile()) {
        return `${specifier}/index.js`;
      }
    }
  } else if (normalized.startsWith('../')) {
    const targetPath = path.resolve(fileDir, normalized);
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
      return specifier;
    }
    const jsTargetPath = `${targetPath}.js`;
    if (fs.existsSync(jsTargetPath) && fs.statSync(jsTargetPath).isFile()) {
      return `${specifier}.js`;
    }
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
      const indexJs = path.join(targetPath, 'index.js');
      if (fs.existsSync(indexJs) && fs.statSync(indexJs).isFile()) {
        return `${specifier}/index.js`;
      }
    }
  }
  return undefined;
}

function fixFile(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileDir = path.dirname(filePath);

  let changed = false;
  const fixed = content.replace(RELATIVE_IMPORT_RE, (match, prefix, quote, specifier) => {
    if (!specifier.startsWith('.') || hasExtension(specifier)) {
      return match;
    }
    const resolved = resolveRelativeSpecifier(fileDir, specifier);
    if (resolved && resolved !== specifier) {
      changed = true;
      return `${prefix}${quote}${resolved}${quote}`;
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(filePath, fixed, 'utf-8');
  }
}

function walkDir(dir: string, callback: (filePath: string) => void): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (entry.isFile() && (fullPath.endsWith('.js') || fullPath.endsWith('.d.ts'))) {
      callback(fullPath);
    }
  }
}

function main() {
  const targetDir = process.argv[2];
  if (!targetDir) {
    console.error('Usage: bun scripts/fix-esm-imports.ts <dist-dir>');
    process.exit(1);
  }
  const absoluteDir = path.isAbsolute(targetDir) ? targetDir : path.resolve(process.cwd(), targetDir);
  if (!fs.existsSync(absoluteDir)) {
    console.error(`Directory not found: ${absoluteDir}`);
    process.exit(1);
  }
  walkDir(absoluteDir, fixFile);
  console.log(`Fixed ESM import extensions in ${absoluteDir}`);
}

main();
