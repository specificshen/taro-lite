import { access, copyFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { plugins } from './constants';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const isCi = typeof process.env.CI === 'string' && process.env.CI.toLowerCase() !== 'false';

if (!isCi) {
  await Promise.all(
    plugins.map(async (plugin) => {
      const sourcePath = resolve(scriptDir, `../swc-backup/${plugin}.wasm`);
      const destinationPath = resolve(scriptDir, `../swc/${plugin}.wasm`);

      try {
        await access(sourcePath, constants.F_OK);
        await copyFile(sourcePath, destinationPath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.log('[@spcsn/taro-helper] swc:backup error: ', error);
        }
      }
    }),
  );
}
