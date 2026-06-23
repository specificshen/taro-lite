import { isString } from '@spcsn/taro/runtime';
import reactPlugin from '@vitejs/plugin-react';
import type { PluginOption } from 'vite';
import { miniVitePlugin } from './vite-mini';

export type Frameworks = 'react';

export interface FrameworkPluginContext {
  initialConfig: {
    framework?: unknown;
    mini?: {
      debugReact?: boolean;
    };
  };
  modifyRunnerOpts: (fn: (args: { opts?: RunnerOptions }) => void) => void;
  runnerUtils: {
    getViteMiniCompilerContext: (rollupContext: unknown) => { loaderMeta?: Record<string, unknown> } | undefined;
  };
}

interface RunnerOptions {
  compiler?:
    | string
    | {
        type: string;
        vitePlugins?: PluginOption[];
      };
}

export function isReactLike(framework: unknown = 'react'): framework is Frameworks {
  return framework === 'react';
}

export default (ctx: FrameworkPluginContext) => {
  const { framework = 'react' } = ctx.initialConfig;

  if (!isReactLike(framework)) return;

  ctx.modifyRunnerOpts(({ opts }) => {
    if (!opts) return;
    if (!opts.compiler) {
      opts.compiler = { type: 'vite' };
    }

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
  return reactPlugin();
}
