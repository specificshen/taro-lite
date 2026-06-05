import { isString } from '@spcsn/taro-shared';

import { miniVitePlugin } from './vite.mini';

import type { IPluginContext } from '@spcsn/taro-service';
import type { PluginOption } from 'vite';

export type Frameworks = 'react';

export function isReactLike(framework: any = 'react'): framework is Frameworks {
  return framework === 'react';
}

export default (ctx: IPluginContext) => {
  const { framework = 'react' } = ctx.initialConfig;

  if (!isReactLike(framework)) return;

  ctx.modifyRunnerOpts(({ opts }) => {
    if (!opts?.compiler) return;

    if (isString(opts.compiler)) {
      opts.compiler = {
        type: opts.compiler,
      };
    }

    const { compiler } = opts;
    if (compiler.type !== 'vite') return;

    compiler.vitePlugins ||= [];
    compiler.vitePlugins.push(VitePresetPlugin());
    compiler.vitePlugins.push(miniVitePlugin(ctx, framework));
  });
};

function VitePresetPlugin(): PluginOption {
  return require('@vitejs/plugin-react').default({
    babel: {
      plugins: [
        ['@babel/plugin-proposal-decorators', { legacy: true }],
        ['@babel/plugin-transform-class-properties', { loose: true }],
      ],
    },
  });
}
