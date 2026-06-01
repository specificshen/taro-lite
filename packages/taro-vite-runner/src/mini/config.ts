import path from 'node:path';

import {
  defaultMainFields,
  fs,
  PLATFORMS,
  recursiveMerge,
  REG_NODE_MODULES_DIR,
  REG_TARO_SCOPED_PACKAGE,
} from '@spcsn/taro-helper';
import { getSassLoaderOption } from '../runner-utils';
import { PLATFORM_TYPE } from '@spcsn/taro-shared';

import { getDefaultPostcssConfig } from './postcss';
import {
  getBabelOption,
  getCSSModulesOptions,
  getMinify,
  getMode,
  getPostcssPlugins,
  stripMultiPlatformExt,
} from '../utils';
import { createBabelTransformPlugin } from '../utils/babel';
import { DEFAULT_TERSER_OPTIONS, MINI_EXCLUDE_POSTCSS_PLUGIN_NAME } from '../utils/constants';
import { logger } from '../utils/logger';

import type { ViteMiniCompilerContext } from '@spcsn/taro/types/compile/viteCompilerContext';
import type { GetManualChunk } from 'rollup';
import type { PluginOption } from 'vite';

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
  const { taroConfig, cwd: appPath, sourceDir } = viteCompilerContext;
  const outputRoot = path.join(appPath, taroConfig.outputRoot || 'dist');
  const enableSourceMap = taroConfig.enableSourceMap ?? false;
  const compactWatch = taroConfig.isWatch && !enableSourceMap;
  const minify = compactWatch ? 'esbuild' : getMinify(taroConfig);
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
    env.TARO_PLATFORM = JSON.stringify(process.env.TARO_PLATFORM || PLATFORM_TYPE.MINI);
    env.NODE_ENV = JSON.stringify(compactWatch ? 'production' : process.env.NODE_ENV);
    env.SUPPORT_TARO_POLYFILL = env.SUPPORT_TARO_POLYFILL || '"disabled"';
    const envConstants = Object.keys(env).reduce((target, key) => {
      target[`process.env.${key}`] = env[key];
      return target;
    }, {});

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
      window: ['@spcsn/taro-runtime', 'window'],
      document: ['@spcsn/taro-runtime', 'document'],
      navigator: ['@spcsn/taro-runtime', 'navigator'],
      requestAnimationFrame: ['@spcsn/taro-runtime', 'requestAnimationFrame'],
      cancelAnimationFrame: ['@spcsn/taro-runtime', 'cancelAnimationFrame'],
      Element: ['@spcsn/taro-runtime', 'TaroElement'],
      SVGElement: ['@spcsn/taro-runtime', 'SVGElement'],
      MutationObserver: ['@spcsn/taro-runtime', 'MutationObserver'],
      history: ['@spcsn/taro-runtime', 'history'],
      location: ['@spcsn/taro-runtime', 'location'],
      URLSearchParams: ['@spcsn/taro-runtime', 'URLSearchParams'],
      URL: ['@spcsn/taro-runtime', 'URL'],
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

  async function getSassOption() {
    const sassLoaderOption = taroConfig.sassLoaderOption;
    const nativeStyleImporter = function importer(url, prev, done) {
      // 让 sass 文件里的 @import 能解析小程序原生样式文体，如 @import "a.wxss";
      const extname = path.extname(url);
      // fix: @import 文件可以不带scss/sass缀，如: @import "define";
      if (extname === '.scss' || extname === '.sass' || extname === '.css' || !extname) {
        return null;
      } else {
        const filePath = path.resolve(path.dirname(prev), url);
        fs.access(filePath, fs.constants.F_OK, (err) => {
          if (err) {
            logger.error(err.message);
            return null;
          } else {
            fs.readFile(filePath)
              .then((res) => {
                done({ contents: res.toString() });
              })
              .catch((err) => {
                logger.error(err);
                return null;
              });
          }
        });
      }
    };
    const importer = [nativeStyleImporter];
    if (sassLoaderOption?.importer) {
      Array.isArray(sassLoaderOption.importer)
        ? importer.unshift(...sassLoaderOption.importer)
        : importer.unshift(sassLoaderOption.importer);
    }
    const option = {
      ...(await getSassLoaderOption(taroConfig)),
      ...sassLoaderOption,
      importer,
    };
    return {
      scss: option,
      sass: option,
    };
  }

  const __postcssOption = getDefaultPostcssConfig({
    designWidth: taroConfig.designWidth || 750,
    deviceRatio: taroConfig.deviceRatio,
    postcssOption: taroConfig.postcss,
  });

  function getManualChunks(): GetManualChunk {
    const { framework } = taroConfig;
    const reactRelatedDeps: RegExp[] = [
      /node_modules[\\/]react-reconciler[\\/]/,
      /node_modules[\\/]react[\\/]/,
      /node_modules[\\/]scheduler[\\/]/,
    ];
    const taroDeps: RegExp[] = [REG_TARO_SCOPED_PACKAGE];
    const taroViteRunnerDeps: RegExp[] = [/node_modules[\\/]@spcsn[\\/]taro-vite-runner/];
    const nodeModulesDeps: RegExp[] = [REG_NODE_MODULES_DIR];
    const babelDeps: RegExp[] = [/node_modules[\\/]@babel[\\/]/];
    const commonjsHelpersDeps: RegExp[] = [/commonjsHelpers\.js$/];
    const tslibDeps: RegExp[] = [/node_modules[\\/]tslib[\\/]/];
    const testByReg2DExpList = (reg2DExpList: RegExp[][]) => (id: string) =>
      reg2DExpList.some((regExpList) => regExpList.some((regExp) => regExp.test(id)));
    switch (framework) {
      case 'react':
        return (id, { getModuleInfo }) => {
          REG_NODE_MODULES_DIR.lastIndex = 0;
          const moduleInfo = getModuleInfo(id);
          if (testByReg2DExpList([taroViteRunnerDeps])(id)) return null;
          if (testByReg2DExpList([babelDeps, commonjsHelpersDeps])(id)) return 'babelHelpers';
          if (testByReg2DExpList([reactRelatedDeps])(id)) return 'common';
          if (testByReg2DExpList([taroDeps, tslibDeps])(id)) return 'taro';
          if (testByReg2DExpList([nodeModulesDeps])(id)) return 'vendors';
          if (moduleInfo?.importers?.length && moduleInfo.importers.length > 1) return 'common';
        };
      default:
        return (id, { getModuleInfo }) => {
          REG_NODE_MODULES_DIR.lastIndex = 0;
          const moduleInfo = getModuleInfo(id);
          if (testByReg2DExpList([taroViteRunnerDeps])(id)) return null;
          if (testByReg2DExpList([nodeModulesDeps, commonjsHelpersDeps])(id)) return 'vendors';
          if (moduleInfo?.importers?.length && moduleInfo.importers.length > 1) return 'common';
        };
    }
  }

  return {
    name: 'taro:vite-mini-config',
    config: async () => {
      if (!enableSourceMap) {
        await removeSourceMapFiles(outputRoot);
      }

      const taroComponentsPath = resolveModulePath(taroConfig.taroComponentsPath, appPath);
      const taroRuntimePath = resolveModulePath('@spcsn/taro-runtime', appPath);

      return {
        mode: getMode(taroConfig),
        build: {
          outDir: outputRoot,
          target: 'es6',
          cssCodeSplit: true,
          emptyOutDir: false,
          lib: {
            entry: taroConfig.entry.app,
            formats: ['cjs'],
          },
          watch: taroConfig.isWatch ? {} : null,
          chunkSizeWarningLimit: Number.MAX_SAFE_INTEGER,
          // @TODO doc needed: sourcemapType not supported
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
            plugins: [
              createBabelTransformPlugin(
                getBabelOption(taroConfig, {
                  defaultExclude: [],
                  defaultInclude: [sourceDir, /(?<=node_modules[\\/]).*taro/],
                }),
              ),
            ],
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
            { find: /@spcsn\/taro-runtime$/, replacement: taroRuntimePath },
            { find: /@spcsn\/taro-components$/, replacement: taroComponentsPath },
            ...getAliasOption(),
          ],
          dedupe: [
            '@spcsn/taro-shared',
            '@spcsn/taro-runtime',
            'react',
            'react-dom',
            'react/jsx-runtime',
            'react-reconciler',
            'scheduler',
          ],
        },
        css: {
          postcss: {
            plugins: getPostcssPlugins(appPath, __postcssOption, MINI_EXCLUDE_POSTCSS_PLUGIN_NAME),
          },
          preprocessorOptions: {
            ...(await getSassOption()),
            less: taroConfig.lessLoaderOption || {},
            stylus: taroConfig.stylusLoaderOption || {},
          },
          modules: getCSSModulesOptions(taroConfig),
        },
      };
    },
  };
}
