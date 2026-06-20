#!/usr/bin/env bun
/**
 * Strip build/runtime dependencies and scripts from archived packages.
 * Archived packages only keep their source and historical metadata.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const archivesDir = path.resolve(__dirname, '../archives/packages');

const keepKeys = new Set([
  'name',
  'version',
  'private',
  'description',
  'author',
  'license',
  'type',
  'main',
  'module',
  'types',
  'exports',
  'files',
  'repository',
  'bugs',
  'homepage',
  'engines',
  'keywords',
]);

const dropKeys = new Set([
  'scripts',
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
  'bundledDependencies',
  'sideEffects',
  'publishConfig',
  'packageManager',
  'workspaces',
  'os',
  'cpu',
  'bin',
  'man',
  'directories',
  'config',
  'funding',
]);

function cleanPackageJson(filePath: string) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const pkg = JSON.parse(raw);
  const cleaned: Record<string, unknown> = {};
  for (const key of Object.keys(pkg)) {
    if (keepKeys.has(key)) {
      cleaned[key] = pkg[key];
    } else if (!dropKeys.has(key)) {
      // Preserve unknown keys to avoid accidental data loss.
      cleaned[key] = pkg[key];
    }
  }
  fs.writeFileSync(filePath, `${JSON.stringify(cleaned, null, 2)}\n`, 'utf8');
  console.log(`Cleaned ${path.relative(process.cwd(), filePath)}`);
}

function main() {
  if (!fs.existsSync(archivesDir)) {
    console.error(`Archives directory not found: ${archivesDir}`);
    process.exit(1);
  }
  const entries = fs.readdirSync(archivesDir, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  for (const dir of dirs) {
    const pkgPath = path.join(archivesDir, dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      cleanPackageJson(pkgPath);
    }
  }
}

main();
