import { isString } from '@spcsn/taro/runtime';
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
  // 小程序产物没有 HMR，@vitejs/plugin-react 的实质作用只剩 JSX automatic runtime 转换；
  // rolldown（oxc）内置了该能力，直接用 transform.jsx 配置替代。
  return {
    name: 'taro:vite-react-jsx',
    config: (_config, env) => ({
      build: {
        rolldownOptions: {
          transform: {
            jsx: {
              runtime: 'automatic' as const,
              importSource: 'react',
              development: env.mode !== 'production',
            },
          },
        },
      },
    }),
  };
}
