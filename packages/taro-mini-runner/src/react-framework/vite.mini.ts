import fs from 'node:fs';
import path from 'node:path';

import { defaultMainFields, resolveSync } from '@spcsn/taro-helper';

import { getLoaderMeta } from './loader-meta';

import type { PluginOption } from 'vite';
import type { FrameworkPluginContext, Frameworks } from './index';

const JSX_DEV_RUNTIME_SHIM_ID = '\0taro-react-jsx-dev-runtime-shim';

export function miniVitePlugin(ctx: FrameworkPluginContext, framework: Frameworks): PluginOption {
  return [injectLoaderMeta(ctx, framework), aliasPlugin(ctx)];
}

function injectLoaderMeta(ctx: FrameworkPluginContext, framework: Frameworks): PluginOption {
  return {
    name: 'taro-react:loader-meta',
    buildStart() {
      const { runnerUtils } = ctx;
      const { getViteMiniCompilerContext } = runnerUtils;
      const viteCompilerContext = getViteMiniCompilerContext(this);
      if (viteCompilerContext) {
        viteCompilerContext.loaderMeta ||= {};
        Object.assign(viteCompilerContext.loaderMeta, getLoaderMeta(framework));
      }
    },
  };
}

function resolvePackageDir(
  id: string,
  resolveOptions: { basedir: string; mainFields: string[] },
  extraBasedirs: string[] = [],
): string {
  for (const basedir of [resolveOptions.basedir, ...extraBasedirs, __dirname, path.resolve(__dirname, '../../')]) {
    try {
      return path.dirname(require.resolve(`${id}/package.json`, { paths: [basedir] }));
    } catch (_error) {
      // fallback to @spcsn/taro-helper resolver below
    }

    const pkgPath = resolveSync(`${id}/package.json`, { ...resolveOptions, basedir });
    if (pkgPath) {
      return path.dirname(pkgPath);
    }
  }
  throw new Error(`Cannot resolve package: ${id}`);
}

function resolvePackageFile(packageDir: string, candidates: string[]): string {
  for (const candidate of candidates) {
    const filePath = path.join(packageDir, candidate);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  throw new Error(`Cannot resolve package file from: ${packageDir}`);
}

function aliasPlugin(ctx: FrameworkPluginContext): PluginOption {
  let jsxDevRuntimeShim = '';
  const taroReactFile = path.resolve(__dirname, '../react-runtime/index.js');

  return {
    name: 'taro-react:alias',
    config(config) {
      const mainFields = ['unpkg', ...defaultMainFields];
      const resolveOptions = {
        basedir: process.cwd(),
        mainFields,
      };
      const alias: { find: string | RegExp; replacement: string }[] = [
        { find: /react-dom$/, replacement: taroReactFile },
        { find: /react-dom\/client$/, replacement: taroReactFile },
      ];

      const isProd = config.mode === 'production';
      if (!isProd && ctx.initialConfig.mini?.debugReact !== true) {
        const reactDir = resolvePackageDir('react', resolveOptions);
        const reactDomDir = resolvePackageDir('react-dom', resolveOptions);
        const reconcilerDir = resolvePackageDir('react-reconciler', resolveOptions, [path.resolve(__dirname, '..')]);
        const schedulerDir = resolvePackageDir('scheduler', resolveOptions, [
          path.resolve(__dirname, '..'),
          reactDomDir,
        ]);

        // 开发模式下默认使用 production 版本的 react 减小体积。debugReact 时保留 dev 版本。
        alias.push({
          find: /^react-reconciler$/,
          replacement: resolvePackageFile(reconcilerDir, [
            'cjs/react-reconciler.production.min.js',
            'cjs/react-reconciler.production.js',
          ]),
        });
        alias.push({
          find: /^react$/,
          replacement: resolvePackageFile(reactDir, ['cjs/react.production.min.js', 'cjs/react.production.js']),
        });
        alias.push({
          find: /^scheduler$/,
          replacement: resolvePackageFile(schedulerDir, [
            'cjs/scheduler.production.min.js',
            'cjs/scheduler.production.js',
          ]),
        });
        alias.push({
          find: /^react\/jsx-runtime$/,
          replacement: resolvePackageFile(reactDir, [
            'cjs/react-jsx-runtime.production.min.js',
            'cjs/react-jsx-runtime.production.js',
          ]),
        });
        const jsxRuntimeFile = resolvePackageFile(reactDir, [
          'cjs/react-jsx-runtime.production.min.js',
          'cjs/react-jsx-runtime.production.js',
        ]);
        jsxDevRuntimeShim = [
          `import { Fragment, jsx, jsxs } from ${JSON.stringify(jsxRuntimeFile)}`,
          'export { Fragment }',
          'export function jsxDEV(type, props, key, isStaticChildren) {',
          '  return isStaticChildren ? jsxs(type, props, key) : jsx(type, props, key)',
          '}',
        ].join('\n');
        alias.push({
          find: /^react\/jsx-dev-runtime$/,
          replacement: JSX_DEV_RUNTIME_SHIM_ID,
        });
      }

      return {
        resolve: {
          alias,
        },
      };
    },
    resolveId(id) {
      if (id === JSX_DEV_RUNTIME_SHIM_ID) return id;
    },
    load(id) {
      if (id === JSX_DEV_RUNTIME_SHIM_ID) return jsxDevRuntimeShim;
    },
  };
}
