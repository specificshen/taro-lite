import { copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const indexTypes = resolve(distDir, 'index.d.ts');

await Promise.all([
  copyFile(indexTypes, resolve(distDir, 'index.cjs.d.ts')),
  copyFile(indexTypes, resolve(distDir, 'runtime.esm.d.ts')),
]);
