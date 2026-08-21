import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ViteMiniCompilerContext } from '@spcsn/taro/types/compile/vite-compiler-context';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import type { Targets } from 'lightningcss';
import type { PluginOption, UserConfig } from 'vite';
import {
  defaultMainFields,
  fs,
  PLATFORMS,
  REG_NODE_MODULES_DIR,
  REG_TARO_SCOPED_PACKAGE,
  recursiveMerge,
} from '../../helper';
import { getCSSModulesOptions, getMinify, getMode, getPostcssPlugins, stripMultiPlatformExt } from '../shared';
import { DEFAULT_TERSER_OPTIONS, MINI_EXCLUDE_POSTCSS_PLUGIN_NAME } from '../shared/constants';
import { createDevBuildSummaryLogger } from '../shared/logger';
import { buildProfiler } from '../shared/profile.js';
import { getDefaultPostcssConfig } from './postcss';

type RolldownInjectOptions = Record<string, string | [string, string]>;

function resolveModulePath(id: string, basedir: string): string {
  if (path.isAbsolute(id)) return id;
  try {
    return Bun.resolveSync(id, basedir);
  } catch {
    return Bun.resolveSync(id, __dirname);
  }
}

/** lightningcss 版本号编码：major << 16 | minor << 8 | patch */
const version = (major: number, minor = 0, patch = 0) => (major << 16) | (minor << 8) | patch;

/** 等价于 browserslist('iOS >= 12, Chrome >= 80, Firefox >= 78') 的 lightningcss targets */
const CSS_TARGETS: Targets = {
  ios_saf: version(12),
  chrome: version(80),
  firefox: version(78),
};

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
    deviceRatio: taroConfig.deviceRatio || {},
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

    /**
     * 传递分析：模块沿 importers 链向上可达的入口（页面 / app / comp 虚拟入口）集合。
     * rolldown 会把「被多个入口引用、又未被 manualChunks 显式归组」的模块自动拆成
     * 独立 chunk，其 wxss 没有任何页面引用会整包丢失（组件样式全灭）；只看直接
     * 引用方会把「直接引用方同属一个 pages|features 作用域、但经中间模块传递后被
     * 多个入口引用」的模块误判为页面私有，因此必须按传递可达的入口数归组。
     */
    type MiniModuleInfo =
      | {
          importers?: string[];
          dynamicImporters?: string[];
          isEntry?: boolean;
        }
      | null
      | undefined;
    const reachableEntriesCache = new Map<string, Set<string>>();
    function collectReachableEntries(
      id: string,
      getModuleInfo: (id: string) => MiniModuleInfo,
      visiting: Set<string> = new Set(),
    ): Set<string> {
      const cached = reachableEntriesCache.get(id);
      if (cached) return cached;
      // 循环依赖：本轮不再上溯以避免死循环，该分支入口由其他路径补足
      if (visiting.has(id)) return new Set();
      const moduleInfo = getModuleInfo(id);
      const importers = [...(moduleInfo?.importers ?? []), ...(moduleInfo?.dynamicImporters ?? [])];
      let entries: Set<string>;
      if (!moduleInfo || moduleInfo.isEntry || importers.length === 0) {
        // 入口模块自身（或无引用方的顶层模块）即上溯终点
        entries = new Set([id]);
      } else {
        visiting.add(id);
        entries = new Set();
        for (const importerId of importers) {
          for (const entryId of collectReachableEntries(importerId, getModuleInfo, visiting)) {
            entries.add(entryId);
          }
        }
        visiting.delete(id);
      }
      reachableEntriesCache.set(id, entries);
      return entries;
    }

    // comp/custom-wrapper 模板必须保留在各自入口 chunk 中，否则 Component()
    // 注册调用会被合并到 common/taro chunk，导致微信初始化阶段警告。
    const taroTemplateEntries = /runner[\/]templates[\/](comp|custom-wrapper)(?:\.js)?$/;

    switch (framework) {
      case 'react':
        return (id, { getModuleInfo }) => {
          REG_NODE_MODULES_DIR.lastIndex = 0;
          if (taroTemplateEntries.test(id)) return undefined;
          if (testByReg2DExpList([taroMiniRunnerDeps])(id)) return null;
          if (testByReg2DExpList([babelDeps, commonjsHelpersDeps])(id)) return 'babelHelpers';
          if (testByReg2DExpList([reactRelatedDeps])(id)) return 'common';
          if (testByReg2DExpList([taroDeps])(id)) return 'common';
          if (testByReg2DExpList([tslibDeps])(id)) return 'vendors';
          if (testByReg2DExpList([nodeModulesDeps])(id)) return 'vendors';
          // 单入口私有模块留在所在 chunk；多入口共享模块显式归入 common，
          // 避免被自动拆成无 wxss 引用的孤儿 chunk
          if (collectReachableEntries(id, getModuleInfo).size <= 1) return undefined;
          return 'common';
        };
      default:
        return (id, { getModuleInfo }) => {
          REG_NODE_MODULES_DIR.lastIndex = 0;
          if (testByReg2DExpList([taroMiniRunnerDeps])(id)) return null;
          if (testByReg2DExpList([nodeModulesDeps, commonjsHelpersDeps])(id)) return 'vendors';
          if (collectReachableEntries(id, getModuleInfo).size <= 1) return undefined;
          return 'common';
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
              // 避免 comp/custom-wrapper 等入口 chunk 的代码被提升到 taro.js 末尾，
              // 导致 Component() 注册调用不在微信初始化阶段而被警告。
              hoistTransitiveImports: false,
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
            // Skyline JSCore 原生支持 async/await，默认不注入 regenerator；
            // 显式配置 compile.regenerator = true 时才 alias 到用户自行安装的 regenerator-runtime
            ...(taroConfig.compile?.regenerator === true
              ? [{ find: 'regenerator-runtime', replacement: resolveModulePath('regenerator-runtime', appPath) }]
              : []),
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
            targets: CSS_TARGETS,
          },
        },
      };
    },
  };
}
