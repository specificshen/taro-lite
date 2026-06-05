import path from 'node:path';
import querystring from 'node:querystring';

import { isNpmPkg, normalizePath, recursiveMerge, REG_NODE_MODULES, resolveSync } from '@spcsn/taro-helper';
import { backSlashRegEx, MINI_EXCLUDE_POSTCSS_PLUGIN_NAME, needsEscapeRegEx, quoteNewlineRegEx } from './constants';
import { createFilterWithCompileOptions } from './create-filter';
import { logger } from './logger';

import type { IPostcssOption } from '@spcsn/taro/types/compile';
import type { TRollupResolveMethod } from '@spcsn/taro/types/compile/config/plugin';
import type {
  ViteMiniBuildConfig,
  ViteMiniCompilerContext,
  VitePageMeta,
} from '@spcsn/taro/types/compile/viteCompilerContext';
import type { CSSModulesOptions } from 'vite';
import type { Target } from 'vite-plugin-static-copy';
import type { TaroBabelInputPluginOptions } from './babel';

export function convertCopyOptions(taroConfig: ViteMiniBuildConfig) {
  const copy = taroConfig.copy;
  const copyOptions: Target[] = [];
  copy?.patterns.forEach(({ from, to }) => {
    const { base, ext } = path.parse(to);
    to = to.replace(new RegExp('^' + taroConfig.outputRoot + '/'), '');
    let rename;

    if (ext) {
      to = to.replace(base, '');
      rename = base;
    } else {
      rename = '/';
    }

    copyOptions.push({
      src: from,
      dest: to,
      rename,
    });
  });
  return copyOptions;
}

export function prettyPrintJson(obj = {}) {
  return JSON.stringify(obj, null, 2);
}

export function getComponentName(
  viteCompilerContext: ViteMiniCompilerContext,
  componentPath: string,
) {
  let componentName: string;
  if (REG_NODE_MODULES.test(componentPath)) {
    const nodeModulesRegx = new RegExp(REG_NODE_MODULES, 'gi');

    componentName = componentPath
      .replace(viteCompilerContext.cwd, '')
      .replace(backSlashRegEx, '/')
      .replace(path.extname(componentPath), '')
      .replace(nodeModulesRegx, 'npm');
  } else {
    componentName = componentPath
      .replace(viteCompilerContext.sourceDir, '')
      .replace(backSlashRegEx, '/')
      .replace(path.extname(componentPath), '');
  }

  return componentName.replace(/^(\/|\\)/, '');
}

const virtualModulePrefix = '\0';
export const virtualModulePrefixREG = new RegExp(`^${virtualModulePrefix}`);

export function appendVirtualModulePrefix(id: string): string {
  return virtualModulePrefix + id;
}

export function stripVirtualModulePrefix(id: string): string {
  return id.replace(virtualModulePrefixREG, '');
}

export function isVirtualModule(id: string): boolean {
  return virtualModulePrefixREG.test(id);
}

export function isRelativePath(id: string | undefined): boolean {
  if (typeof id !== 'string') return false;

  if (path.isAbsolute(id)) return false;

  if (/^[a-z][a-z0-9+.-]*:/i.test(id)) return false;

  return true;
}

export function stripMultiPlatformExt(id: string): string {
  return id.replace(new RegExp(`\\.(${process.env.TARO_ENV}|${process.env.TARO_PLATFORM})$`), '');
}

export const addLeadingSlash = (url = '') => (url.charAt(0) === '/' ? url : '/' + url);
export const addTrailingSlash = (url = '') => (url.charAt(url.length - 1) === '/' ? url : url + '/');
export const stripTrailingSlash = (url = '') =>
  url.charAt(url.length - 1) === '/' ? url.substring(0, url.length - 1) : url;

export function getMode(config: ViteMiniBuildConfig) {
  const preMode = config.mode || process.env.NODE_ENV;
  const modes: ('production' | 'development' | 'none')[] = ['production', 'development', 'none'];
  const mode =
    modes.find((e) => e === preMode) ||
    (!config.isWatch || process.env.NODE_ENV === 'production' ? 'production' : 'development');
  return mode;
}

export function genRouterResource(page: VitePageMeta) {
  return [
    'Object.assign({',
    `  path: '${page.name}',`,
    '  load: async function(context, params) {',
    `    const page = await import("${normalizePath(page.scriptPath)}")`,
    '    return [page, context, params]',
    '  }',
    `}, ${JSON.stringify(page.config)})`,
  ].join('\n');
}

export function getQueryParams(path: string) {
  return querystring.parse(path.split('?')[1]);
}

export function generateQueryString(params: { [key: string]: string }): string {
  return querystring.stringify(params);
}

export function getPostcssPlugins(
  appPath: string,
  option = {} as IPostcssOption,
  excludePluginNames = MINI_EXCLUDE_POSTCSS_PLUGIN_NAME,
) {
  const plugins: any[] = [];

  option.forEach(([pluginName, pluginOption, pluginPkg]) => {
    if (!pluginOption || excludePluginNames.includes(pluginName)) return;
    if (Object.hasOwnProperty.call(pluginOption, 'enable') && !pluginOption.enable) return;

    if (pluginPkg) {
      plugins.push(pluginPkg(pluginOption.config || {}));
      return;
    }

    if (!isNpmPkg(pluginName)) {
      // local plugin
      pluginName = path.join(appPath, pluginName);
    }

    try {
      const pluginPath = resolveSync(pluginName, { basedir: appPath }) || '';
      plugins.push(require(pluginPath)(pluginOption.config || {}));
    } catch (e) {
      const error = e as NodeJS.ErrnoException;
      const msg =
        error.code === 'MODULE_NOT_FOUND'
          ? `缺少 postcss 插件 "${pluginName}", 已忽略`
          : error.message || String(error);
      logger.info(msg);
    }
  });

  return plugins;
}

export function getMinify(
  taroConfig: ViteMiniBuildConfig,
): 'oxc' | 'terser' | 'esbuild' | boolean {
  const isProd = getMode(taroConfig) === 'production';
  const hasExplicitJsMinimizer = typeof taroConfig.jsMinimizer === 'string';
  if (!isProd && !hasExplicitJsMinimizer) return false;

  return taroConfig.jsMinimizer === 'terser'
      ? taroConfig.terser?.enable === false
        ? false
        : 'terser'
      : taroConfig.jsMinimizer === 'esbuild'
        ? taroConfig.esbuild?.minify?.enable === false
          ? false // 只有在明确配置了 esbuild.minify.enable: false 时才不启用压缩
          : 'esbuild'
        : !hasExplicitJsMinimizer && taroConfig.terser?.enable === false
          ? false
          : 'oxc';
}

export function getCSSModulesOptions(
  taroConfig: ViteMiniBuildConfig,
): false | CSSModulesOptions {
  if (taroConfig.postcss?.cssModules?.enable !== true) return false;
  const config = recursiveMerge(
    {},
    {
      namingPattern: 'module',
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
    taroConfig.postcss.cssModules.config,
  );
  return {
    generateScopedName: config.generateScopedName,
  };
}

export function getBabelOption(
  taroConfig: ViteMiniBuildConfig,
  filterConfig: {
    babelOption?: Partial<TaroBabelInputPluginOptions>;
    defaultInclude?: (string | RegExp)[];
    defaultExclude?: (string | RegExp)[];
  } = {},
): TaroBabelInputPluginOptions {
  const { compile = {} } = taroConfig;
  const { defaultExclude = [], defaultInclude = [], babelOption } = filterConfig;
  const opts: TaroBabelInputPluginOptions = {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.es6', '.es', '.mjs', '.mts'],
    babelHelpers: 'runtime',
    skipPreflightCheck: true,
    compact: false,
    ...babelOption,
  };
  opts.filter = createFilterWithCompileOptions(compile, defaultInclude, defaultExclude);

  return opts;
}

export function escapePath(p: string) {
  return p.replace(/\\{1,2}/g, '/');
}

export function parseRelativePath(from: string, to: string) {
  const relativePath = escapePath(path.relative(from, to));

  return /^\.{1,2}[\\/]/.test(relativePath)
    ? relativePath
    : /^\.{1,2}$/.test(relativePath)
      ? `${relativePath}/`
      : `./${relativePath}`;
}

export function escapeId(id: string): string {
  if (!needsEscapeRegEx.test(id)) return id;
  return id.replace(backSlashRegEx, '\\\\').replace(quoteNewlineRegEx, '\\$1');
}

export function resolveAbsoluteRequire({
  name = '',
  importer = '',
  outputRoot = '',
  targetRoot = '',
  code = '',
  resolve,
  modifyResolveId,
}: {
  importer: string;
  code: string;
  name?: string;
  outputRoot?: string;
  targetRoot?: string;
  resolve?: TRollupResolveMethod;
  modifyResolveId?: unknown;
}) {
  outputRoot = escapePath(outputRoot);
  targetRoot = escapePath(targetRoot);
  const resolveId = typeof modifyResolveId === 'function' ? modifyResolveId : undefined;
  return code.replace(/(?:import\s|from\s|require\()['"]([^.][^'"\s]+)['"]\)?/g, (src: string, source: string) => {
    importer = stripVirtualModulePrefix(importer);
    const absolutePath: string = escapePath(
      resolveId
        ? resolveId({
            source,
            importer,
            options: {
              isEntry: false,
              skipSelf: true,
            },
            name,
            resolve,
          })?.id || source
        : source,
    );
    let parsePath = '';
    if (absolutePath.startsWith(outputRoot)) {
      let outputPath = importer;
      if (path.isAbsolute(outputPath)) {
        const commonPath = getCommonPath(targetRoot, importer);
        outputPath = path.relative(commonPath, importer);
      }
      const outputFile = path.resolve(outputRoot, outputPath);
      const outputDir = path.dirname(outputFile);
      parsePath = src.replace(source, parseRelativePath(outputDir, absolutePath));
    } else if (absolutePath.startsWith(targetRoot)) {
      parsePath = src.replace(source, parseRelativePath(path.dirname(importer), absolutePath));
    } else {
      parsePath = src.replace(source, absolutePath);
    }
    return parsePath;
  });
}

let lastCommonPath = '';
function getCommonPath(a: string, b: string) {
  const aArr = path.normalize(a).split(/[\\/]/);
  const bArr = path.normalize(b).split(/[\\/]/);
  let i = 0;
  while (aArr[i] === bArr[i]) {
    i++;
  }

  if (aArr.length > i) {
    // Note: 项目外部文件，仅返回所有外部文件的最短公共路径
    if (!lastCommonPath || lastCommonPath.split(/[\\/]/).length > i) {
      lastCommonPath = aArr.slice(0, i).join('/');
    }
    return lastCommonPath;
  } else {
    // Note: 项目内部文件，返回项目根路径
    return a;
  }
}
