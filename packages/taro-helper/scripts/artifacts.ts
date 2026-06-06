import { copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { plugins } from './constants';

const scriptDir = dirname(fileURLToPath(import.meta.url));

await Promise.all(
  plugins.map(async (plugin) => {
    const sourcePath = resolve(
      scriptDir,
      `../../../crates/native_binding/artifacts/wasm-wasi-swc_plugins/${plugin}.wasm`,
    );
    const destinationPath = resolve(scriptDir, `../swc/${plugin}.wasm`);

    try {
      await copyFile(sourcePath, destinationPath);
    } catch (error) {
      console.log('[@spcsn/taro-helper] artifacts error: ', error);
    }
  }),
);
