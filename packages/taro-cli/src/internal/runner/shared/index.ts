import path from 'node:path';
import type { Func, IPostcssOption, IPxTransformOption } from '@spcsn/taro/types/compile';
import type { ViteMiniBuildConfig, ViteMiniCompilerContext } from '@spcsn/taro/types/compile/vite-compiler-context';
import type { AcceptedPlugin } from 'postcss';
import type { CSSModulesOptions } from 'vite';
import { isNpmPkg, REG_NODE_MODULES, recursiveMerge, resolveSync } from '../../helper';
import { backSlashRegEx, MINI_EXCLUDE_POSTCSS_PLUGIN_NAME } from './constants';
import { logger } from './logger';
import type { StaticCopyTarget } from './static-copy';

export function convertCopyOptions(taroConfig: ViteMiniBuildConfig) {
  const copy = taroConfig.copy;
  const copyOptions: StaticCopyTarget[] = [];
  copy?.patterns.forEach(({ from, to }) => {
    const { base, ext } = path.parse(to);
    to = to.replace(new RegExp('^' + taroConfig.outputRoot + '/'), '');
    let rename: string | undefined;

    if (ext) {
      to = to.replace(base, '');
      rename = base;
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

export function getComponentName(viteCompilerContext: ViteMiniCompilerContext, componentPath: string) {
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
  return id.replace(/\.(weapp|mini)$/, '');
}

export function getMode(config: ViteMiniBuildConfig) {
  const preMode = config.mode || process.env.NODE_ENV;
  const modes: ('production' | 'development' | 'none')[] = ['production', 'development', 'none'];
  const mode =
    modes.find((e) => e === preMode) ||
    (!config.isWatch || process.env.NODE_ENV === 'production' ? 'production' : 'development');
  return mode;
}

export async function getPostcssPlugins(
  appPath: string,
  option = {} as IPostcssOption,
  excludePluginNames = MINI_EXCLUDE_POSTCSS_PLUGIN_NAME,
) {
  const plugins: AcceptedPlugin[] = [];

  for (const [pluginName, pluginOption, pluginPkg] of option as [
    string,
    { enable?: boolean; config?: Record<string, unknown> | IPxTransformOption } | undefined,
    Func?,
  ][]) {
    if (!pluginOption || excludePluginNames.includes(pluginName)) continue;
    if (Object.hasOwn(pluginOption, 'enable') && !pluginOption.enable) continue;

    if (pluginPkg) {
      plugins.push(pluginPkg(pluginOption.config || {}) as AcceptedPlugin);
      continue;
    }

    const resolvedPluginName = !isNpmPkg(pluginName) ? path.join(appPath, pluginName) : pluginName;

    const pluginPath = resolveSync(resolvedPluginName, { basedir: appPath });
    if (!pluginPath) {
      logger.info(`缺少 postcss 插件 "${pluginName}", 已忽略`);
      continue;
    }

    try {
      const pluginModule = await import(pluginPath);
      plugins.push(pluginModule.default(pluginOption.config || {}) as AcceptedPlugin);
    } catch (e) {
      const error = e as NodeJS.ErrnoException;
      logger.info(error.message || String(error));
    }
  }

  return plugins;
}

export function getMinify(taroConfig: ViteMiniBuildConfig): 'oxc' | 'terser' | 'esbuild' | boolean {
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

export function getCSSModulesOptions(taroConfig: ViteMiniBuildConfig): false | CSSModulesOptions {
  if (taroConfig.postcss?.cssModules?.enable !== true) return false;
  const config = recursiveMerge(
    {},
    {
      namingPattern: 'module',
      generateScopedName: '[hash:hex:8]',
    },
    taroConfig.postcss.cssModules.config,
  );

  // base64 hash 可能产生 `-` / `--`，WXSS 编译器解析严格，统一替换为 hex
  const generateScopedName = String(config.generateScopedName).replace(/\[hash:base64:\d+\]/g, '[hash:hex:8]');
  if (generateScopedName !== config.generateScopedName) {
    logger.warn(
      `CSS Modules generateScopedName "${config.generateScopedName}" contains base64 hash, which may produce class names incompatible with WeChat WXSS. It has been automatically replaced with "${generateScopedName}".`,
    );
  }

  return {
    generateScopedName,
  };
}
export function escapePath(p: string) {
  return p.replace(/\\{1,2}/g, '/');
}
