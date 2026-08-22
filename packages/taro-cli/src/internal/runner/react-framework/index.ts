import { isString } from '@spcsn/taro/runtime';
import type { PluginOption } from 'vite';
import { miniVitePlugin } from './vite-mini';

export type Frameworks = 'react';

export interface FrameworkPluginContext {
  initialConfig: {
    framework?: unknown;
  };
  modifyRunnerOpts: (fn: (args: { opts?: RunnerOptions }) => void) => void;
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
    compiler.vitePlugins.push(miniVitePlugin());
  });
};

function VitePresetPlugin(): PluginOption {
  // 小程序产物没有 HMR，@vitejs/plugin-react 的实质作用只剩 JSX automatic runtime 转换；
  // rolldown（oxc）内置该能力，无需额外配置。唯一要钉死的是 development：
  // Vite 8 把它默认绑定到 process.env.NODE_ENV，dev 环境下每个 jsx 调用都会带
  // source/self 调试参数（业务工程实测 +171KB）。
  return {
    name: 'taro:vite-react-jsx',
    config: () => ({
      oxc: { jsx: { development: false } },
    }),
  };
}
