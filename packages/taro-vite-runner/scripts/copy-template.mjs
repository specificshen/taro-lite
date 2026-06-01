import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const templateDir = resolve(packageRoot, 'dist/template');

await mkdir(templateDir, { recursive: true });

await Promise.all([
  copyFile(resolve(packageRoot, 'src/template/comp.ts'), resolve(templateDir, 'comp.js')),
  copyFile(resolve(packageRoot, 'src/template/custom-wrapper.ts'), resolve(templateDir, 'custom-wrapper.js')),
]);
