import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PluginOption } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * react-dom 在小程序侧由自定义渲染器（react-runtime）承担，整体别名过去。
 * 产物恒为 production（含 watch）：react / scheduler / react-reconciler 内部的
 * NODE_ENV 分支由 cli 注入的 process.env.NODE_ENV=production define 收敛。
 */
export function miniVitePlugin(): PluginOption {
  const taroReactFile = path.resolve(__dirname, '../react-runtime/index.ts');
  return {
    name: 'taro-react:alias',
    config: () => ({
      resolve: {
        alias: [
          { find: /react-dom$/, replacement: taroReactFile },
          { find: /react-dom\/client$/, replacement: taroReactFile },
        ],
      },
    }),
  };
}
