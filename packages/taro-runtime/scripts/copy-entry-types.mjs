import { copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const distDir = resolve(import.meta.dirname, '../dist');
const indexTypes = resolve(distDir, 'index.d.ts');

await Promise.all([
  copyFile(indexTypes, resolve(distDir, 'index.cjs.d.ts')),
  copyFile(indexTypes, resolve(distDir, 'runtime.esm.d.ts')),
]);
