import path from 'node:path';
import type { ViteMiniCompilerContext } from '@spcsn/taro/types/compile/vite-compiler-context';
import browserslist from 'browserslist';
import { browserslistToTargets } from 'lightningcss';
import type { PluginOption, UserConfig } from 'vite';
import {
  defaultMainFields,
  fs,
  PLATFORMS,
  REG_NODE_MODULES_DIR,
  REG_TARO_SCOPED_PACKAGE,
  recursiveMerge,
} from '../../taro-helper';
import { getCSSModulesOptions, getMinify, getMode, getPostcssPlugins, stripMultiPlatformExt } from '../shared';
import { DEFAULT_TERSER_OPTIONS, MINI_EXCLUDE_POSTCSS_PLUGIN_NAME } from '../shared/constants';
import { createDevBuildSummaryLogger } from '../shared/logger';
import { buildProfiler } from '../shared/profile.js';
import { getDefaultPostcssConfig } from './postcss';

type RolldownInjectOptions = Record<string, string | [string, string]>;

function resolveModulePath(id: string, basedir: string): string {
  if (path.isAbsolute(id)) return id;
  return require.resolve(id, { paths: [basedir, __dirname] });
}

function normalizeInjectValue(value: string | string[]): string | [string, string] {
  if (!Array.isArray(value)) return value;
  return value.length <= 1 ? (value[0] ?? '') : [value[0] ?? '', value[1] ?? ''];
}

async function removeSourceMapFiles(dir: string) {
  if (!(await fs.pathExists(dir))) return;

  const entries = await fs.readdir(dir);
  await Promise.all(
    entries.map(async (entry) => {
      const filePath = path.join(dir, entry);
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        await removeSourceMapFiles(filePath);
        return;
      }
      if (filePath.endsWith('.map')) {
        await fs.remove(filePath);
      }
    }),
  );
}

export default function (viteCompilerContext: ViteMiniCompilerContext): PluginOption {
  const { taroConfig, cwd: appPath } = viteCompilerContext;
  const outputRoot = path.join(appPath, taroConfig.outputRoot || 'dist');
  const enableSourceMap = taroConfig.enableSourceMap ?? false;
  const compactWatch = taroConfig.isWatch && !enableSourceMap;
  const minify = compactWatch && !taroConfig.jsMinimizer ? false : getMinify(taroConfig);
  function getDefineOption() {
    const {
      env = {},
      runtime = {} as Record<string, boolean>,
      defineConstants = {},
      framework = 'react',
      buildAdapter = PLATFORMS.WEAPP,
    } = taroConfig;

    env.FRAMEWORK = JSON.stringify(framework);
    env.TARO_ENV = JSON.stringify(buildAdapter);
    env.TARO_PLATFORM = JSON.stringify('mini');
    env.NODE_ENV = JSON.stringify(process.env.NODE_ENV || getMode(taroConfig));
    env.SUPPORT_TARO_POLYFILL = env.SUPPORT_TARO_POLYFILL || '"disabled"';
    const envConstants = Object.keys(env).reduce(
      (target, key) => {
        target[`process.env.${key}`] = env[key];
        return target;
      },
      {} as Record<string, string>,
    );

    const runtimeConstants = {
      ENABLE_SIZE_APIS: runtime.enableSizeAPIs ?? false,
      ENABLE_TEMPLATE_CONTENT: runtime.enableTemplateContent ?? false,
      ENABLE_CLONE_NODE: runtime.enableCloneNode ?? false,
      ENABLE_CONTAINS: runtime.enableContains ?? false,
      ENABLE_MUTATION_OBSERVER: runtime.enableMutationObserver ?? false,
    };

    return {
      ...envConstants,
      ...defineConstants,
      ...runtimeConstants,
    };
  }

  function getAliasOption() {
    const alias = taroConfig.alias || {};
    return Object.entries(alias).map(([find, replacement]) => {
      return { find, replacement };
    });
  }

  function getInjectOption(): RolldownInjectOptions {
    const options: RolldownInjectOptions = {
      window: ['@spcsn/taro/runtime', 'window'],
      document: ['@spcsn/taro/runtime', 'document'],
      navigator: ['@spcsn/taro/runtime', 'navigator'],
      requestAnimationFrame: ['@spcsn/taro/runtime', 'requestAnimationFrame'],
      cancelAnimationFrame: ['@spcsn/taro/runtime', 'cancelAnimationFrame'],
      Element: ['@spcsn/taro/runtime', 'TaroElement'],
      SVGElement: ['@spcsn/taro/runtime', 'SVGElement'],
      MutationObserver: ['@spcsn/taro/runtime', 'MutationObserver'],
      history: ['@spcsn/taro/runtime', 'history'],
      location: ['@spcsn/taro/runtime', 'location'],
      URLSearchParams: ['@spcsn/taro/runtime', 'URLSearchParams'],
      URL: ['@spcsn/taro/runtime', 'URL'],
    };

    const injectOptions = taroConfig.injectOptions;

    if (injectOptions?.include) {
      for (const key in injectOptions.include) {
        options[key] = normalizeInjectValue(injectOptions.include[key]);
      }
    }

    if (injectOptions?.exclude?.length) {
      injectOptions.exclude.forEach((item) => {
        delete options[item];
      });
    }

    return options;
  }
  const __postcssOption = getDefaultPostcssConfig({
    designWidth: taroConfig.designWidth || 750,
    deviceRatio: taroConfig.deviceRatio,
    postcssOption: taroConfig.postcss,
  });

  function getManualChunks(): NonNullable<
    NonNullable<UserConfig['build']>['rollupOptions']
  >['output'] extends infer Output
    ? Output extends { manualChunks?: infer ManualChunks }
      ? ManualChunks
      : never
    : never {
    const { framework } = taroConfig;
    const reactRelatedDeps: RegExp[] = [
      /node_modules[\\/]react-reconciler[\\/]/,
      /node_modules[\\/]react[\\/]/,
      /node_modules[\\/]scheduler[\\/]/,
    ];
    const taroDeps: RegExp[] = [REG_TARO_SCOPED_PACKAGE];
    const taroMiniRunnerDeps: RegExp[] = [/node_modules[\\/]@spcsn[\\/]taro-mini-runner/];
    const nodeModulesDeps: RegExp[] = [REG_NODE_MODULES_DIR];
    const babelDeps: RegExp[] = [/node_modules[\\/]@babel[\\/]/];
    const commonjsHelpersDeps: RegExp[] = [/commonjsHelpers\.js$/];
    const tslibDeps: RegExp[] = [/node_modules[\\/]tslib[\\/]/];
    const testByReg2DExpList = (reg2DExpList: RegExp[][]) => (id: string) =>
      reg2DExpList.some((regExpList) => regExpList.some((regExp) => regExp.test(id)));

    /** 提取模块所属页面/特性作用域，例如 pages/form-lab 或 features/form-lab */
    function getPageScope(id: string): string | null {
      const match = id.match(/[\\/](pages|features)[\\/]([^\\/]+)(?:[\\/]|$)/);
      return match ? `${match[1]}/${match[2]}` : null;
    }

    /** 若一个模块的所有引用方都来自同一个页面作用域，则它应留在页面 chunk，不进 common */
    function isPrivateToSinglePage(id: string, getModuleInfo: (id: string) => any): boolean {
      const moduleInfo = getModuleInfo(id);
      if (!moduleInfo?.importers?.length) return false;
      let commonScope: string | undefined;
      for (const importerId of moduleInfo.importers) {
        const scope = getPageScope(importerId);
        if (!scope) return false;
        if (commonScope === undefined) {
          commonScope = scope;
        } else if (commonScope !== scope) {
          return false;
        }
      }
      return true;
    }

    switch (framework) {
      case 'react':
        return (id, { getModuleInfo }) => {
          REG_NODE_MODULES_DIR.lastIndex = 0;
          const moduleInfo = getModuleInfo(id);
          if (testByReg2DExpList([taroMiniRunnerDeps])(id)) return null;
          if (testByReg2DExpList([babelDeps, commonjsHelpersDeps])(id)) return 'babelHelpers';
          if (testByReg2DExpList([reactRelatedDeps])(id)) return 'common';
          if (testByReg2DExpList([taroDeps, tslibDeps])(id)) return 'taro';
          if (testByReg2DExpList([nodeModulesDeps])(id)) return 'vendors';
          if (isPrivateToSinglePage(id, getModuleInfo)) return undefined;
          if (moduleInfo?.importers?.length && moduleInfo.importers.length > 1) return 'common';
        };
      default:
        return (id, { getModuleInfo }) => {
          REG_NODE_MODULES_DIR.lastIndex = 0;
          const moduleInfo = getModuleInfo(id);
          if (testByReg2DExpList([taroMiniRunnerDeps])(id)) return null;
          if (testByReg2DExpList([nodeModulesDeps, commonjsHelpersDeps])(id)) return 'vendors';
          if (isPrivateToSinglePage(id, getModuleInfo)) return undefined;
          if (moduleInfo?.importers?.length && moduleInfo.importers.length > 1) return 'common';
        };
    }
  }

  return {
    name: 'taro:vite-mini-config',
    config: async () => {
      const configStartMs = buildProfiler.start();
      if (!enableSourceMap) {
        await buildProfiler.measure('source map cleanup', () => removeSourceMapFiles(outputRoot));
      }

      const moduleResolveStartMs = buildProfiler.start();
      const taroComponentsPath = resolveModulePath(taroConfig.taroComponentsPath, appPath);
      const taroRuntimePath = resolveModulePath('@spcsn/taro/runtime', appPath);
      buildProfiler.end('resolve runtime modules', moduleResolveStartMs);

      buildProfiler.end('vite config', configStartMs);

      return {
        mode: getMode(taroConfig),
        customLogger: taroConfig.isWatch ? createDevBuildSummaryLogger(outputRoot) : undefined,
        build: {
          outDir: outputRoot,
          target: 'es2022',
          cssCodeSplit: true,
          emptyOutDir: false,
          lib: {
            entry: taroConfig.entry.app,
            formats: ['cjs'],
          },
          watch: taroConfig.isWatch ? {} : null,
          chunkSizeWarningLimit: Number.MAX_SAFE_INTEGER,
          // Rolldown 当前只接收 Vite 的 sourcemap 开关，不再透传旧 sourcemapType。
          sourcemap: enableSourceMap,
          rolldownOptions: {
            checks: {
              pluginTimings: false,
            },
            transform: {
              inject: getInjectOption(),
            },
            output: {
              entryFileNames(chunkInfo) {
                return stripMultiPlatformExt(chunkInfo.name) + taroConfig.fileType.script;
              },
              chunkFileNames: taroConfig.output!.chunkFileNames,
              manualChunks: getManualChunks(),
            },
          },
          commonjsOptions: {
            exclude: [/\.esm/, /[/\\]esm[/\\]/],
            transformMixedEsModules: true,
          },
          minify,
          terserOptions:
            minify === 'terser'
              ? recursiveMerge({}, DEFAULT_TERSER_OPTIONS, taroConfig.terser?.config || {})
              : undefined,
        },
        define: getDefineOption(),
        resolve: {
          mainFields: [...defaultMainFields],
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.mts'],
          alias: [
            // 小程序使用 regenerator-runtime@0.11
            { find: 'regenerator-runtime', replacement: require.resolve('regenerator-runtime') },
            { find: /@spcsn\/taro\/runtime$/, replacement: taroRuntimePath },
            { find: /@spcsn\/taro-components$/, replacement: taroComponentsPath },
            ...getAliasOption(),
          ],
          dedupe: ['@spcsn/taro/runtime', 'react', 'react-dom', 'react/jsx-runtime', 'react-reconciler', 'scheduler'],
        },
        css: {
          postcss: {
            plugins: await getPostcssPlugins(appPath, __postcssOption, MINI_EXCLUDE_POSTCSS_PLUGIN_NAME),
          },
          modules: getCSSModulesOptions(taroConfig),
          lightningcss: {
            // 小程序 Skyline 对现代 CSS 简写（如 inset、#RRGGBBAA）支持有限，
            // 将 CSS targets 锁定在较早浏览器版本，避免 LightningCSS 生成这些语法。
            // wxss-compat 后处理仍会兜底转换，形成双重保险。
            targets: browserslistToTargets(browserslist('iOS >= 12, Chrome >= 80, Firefox >= 78')),
          },
        },
      };
    },
  };
}
