import { resolve } from 'node:path';

import { transformSync } from '@swc/core';
import { defaults } from 'lodash';

import { REG_SCRIPTS } from '../constants';
import { fs } from '../utils';

import type { Config, Output } from '@swc/core';

export function getSwcPlugin(config?: Config) {
  return {
    name: 'swc-plugin',
    setup(build) {
      const namespace = 'tarojs:swc-helper';
      build.onResolve({ filter: REG_SCRIPTS, namespace }, ({ resolveDir, path }) => ({
        path: resolve(resolveDir, path),
      }));

      build.onLoad({ filter: REG_SCRIPTS, namespace }, async ({ path }) => {
        const code = await fs.readFile(path, 'utf-8');
        const result: Output = transformSync(
          code,
          defaults(config, {
            jsc: { target: 'es2015' },
            filename: path,
            sourceMaps: true,
            sourceFileName: path,
          }),
        );

        return {
          contents: result.code,
          loader: 'js',
        };
      });
    },
  };
}
