import * as fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';
import type { Config } from '@swc/core';
import { transformSync } from '@swc/core';

function getModuleDefaultExport(exports: Record<string, unknown>): unknown {
  if (exports.__esModule) return exports.default;
  if (exports.default !== undefined) return exports.default;
  return exports;
}

interface UserConfigModuleLoaderOptions {
  customConfig?: {
    alias?: Record<string, string>;
    define?: Record<string, string>;
  };
  customSwcConfig?: Config;
  cwd?: string;
}

const SCRIPT_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyDefineConstants(source: string, define: Record<string, string> = {}) {
  return Object.entries(define).reduce((result, [key, value]) => {
    if (!/^[$A-Z_a-z][$\w]*$/.test(key) || key === value) return result;
    return result.replace(new RegExp(`\\b${escapeRegExp(key)}\\b`, 'g'), value);
  }, source);
}

const DEFINE_CONFIG_MACROS = {
  defineAppConfig: 'function defineAppConfig(config) { return config; }',
  definePageConfig: 'function definePageConfig(config) { return config; }',
  importNativeComponent:
    'function importNativeComponent(path = "", name = "", exportName = "default") { return name; }',
} as const;

function applyDefineConfigMacros(source: string) {
  const macros = Object.entries(DEFINE_CONFIG_MACROS)
    .filter(([name]) => new RegExp(`\\b${escapeRegExp(name)}\\s*\\(`).test(source))
    .map(([, macro]) => macro);
  return macros.length > 0 ? `${macros.join('\n')}\n${source}` : source;
}

function resolveAlias(request: string, alias: Record<string, string> = {}) {
  for (const [key, target] of Object.entries(alias)) {
    if (request === key) return target;
    if (request.startsWith(`${key}/`)) return path.join(target, request.slice(key.length + 1));
  }
}

/** 在源码层面对 import / require 的别名路径进行解析，兼容 Vitest 等不经过 loader hooks 的环境 */
function resolveAliasesInSource(source: string, alias: Record<string, string> = {}) {
  if (Object.keys(alias).length === 0) return source;
  return source.replace(
    /((?:import|export)\s+(?:[^'"]*?)\s*from\s*|import\s*\(\s*|require\s*\(\s*)(['"])([^'"]+)\2/g,
    (_match, prefix, quote, spec) => {
      const resolved = resolveAlias(spec, alias);
      return resolved ? `${prefix}${quote}${resolved}${quote}` : _match;
    },
  );
}

function createSwcConfig(customSwcConfig: Config = {}): Config {
  const defaultSwcConfig: Config = {
    jsc: {
      target: 'es2015',
      parser: {
        syntax: 'typescript',
        tsx: true,
        decorators: true,
      },
    },
    module: {
      type: 'commonjs',
    },
  };

  return {
    ...defaultSwcConfig,
    ...customSwcConfig,
    module: customSwcConfig.module ?? defaultSwcConfig.module,
  };
}

function transformConfigModule(
  filename: string,
  customConfig: UserConfigModuleLoaderOptions['customConfig'],
  customSwcConfig: Config,
) {
  const source = fs.readFileSync(filename, 'utf-8');
  const aliasSource = resolveAliasesInSource(source, customConfig?.alias);
  const macroSource = applyDefineConfigMacros(aliasSource);
  const definedSource = applyDefineConstants(macroSource, customConfig?.define);
  return transformSync(definedSource, createSwcConfig(customSwcConfig)).code || '';
}

function createConfigRequire(
  parentFilename: string,
  customConfig: UserConfigModuleLoaderOptions['customConfig'],
  customSwcConfig: Config,
) {
  const nativeRequire = createRequire(parentFilename);
  return function require(id: string) {
    const request = resolveAlias(id, customConfig?.alias) || id;
    if (!path.isAbsolute(request) && !request.startsWith('.')) {
      return nativeRequire(request);
    }
    const resolved = resolveExistingScriptPath(
      request,
      pathToFileURL(parentFilename).href,
      path.dirname(parentFilename),
    );
    if (!resolved) {
      throw new Error(`Cannot find module '${id}' from '${parentFilename}'`);
    }
    return runConfigModule(resolved, customConfig, customSwcConfig);
  };
}

function runConfigModule(
  filename: string,
  customConfig: UserConfigModuleLoaderOptions['customConfig'],
  customSwcConfig: Config,
) {
  const code = transformConfigModule(filename, customConfig, customSwcConfig);
  const module = { exports: {} as Record<string, unknown> };
  const wrapper = `(function(exports, require, module, __filename, __dirname, global, process){${code}\n})`;
  const fn = vm.runInThisContext(wrapper, { filename });
  fn(
    module.exports,
    createConfigRequire(filename, customConfig, customSwcConfig),
    module,
    filename,
    path.dirname(filename),
    global,
    process,
  );
  return module.exports;
}

function getParentDirectory(parentURL: string | undefined, cwd: string) {
  if (!parentURL?.startsWith('file:')) {
    return cwd;
  }
  return path.dirname(fileURLToPath(parentURL));
}

function toAbsolutePath(request: string, parentURL: string | undefined, cwd: string) {
  if (request.startsWith('file:')) {
    return fileURLToPath(request);
  }
  if (path.isAbsolute(request)) {
    return request;
  }
  return path.resolve(getParentDirectory(parentURL, cwd), request);
}

function resolveExistingScriptPath(request: string, parentURL: string | undefined, cwd: string) {
  const requestPath = toAbsolutePath(request, parentURL, cwd);
  const extension = path.extname(requestPath);

  if (SCRIPT_EXTENSIONS.includes(extension) && fs.existsSync(requestPath)) {
    return requestPath;
  }

  for (const ext of SCRIPT_EXTENSIONS) {
    const candidate = `${requestPath}${ext}`;
    if (fs.existsSync(candidate)) return candidate;
  }

  try {
    if (fs.statSync(requestPath).isDirectory()) {
      for (const ext of SCRIPT_EXTENSIONS) {
        const candidate = path.join(requestPath, `index${ext}`);
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  } catch {
    // ignore
  }
}

export async function loadUserConfigModule(
  id: string,
  { customConfig = {}, customSwcConfig = {}, cwd = process.cwd() }: UserConfigModuleLoaderOptions = {},
) {
  const resolvedId = path.isAbsolute(id) ? id : path.resolve(cwd, id);
  const exports = runConfigModule(resolvedId, customConfig, customSwcConfig);
  return getModuleDefaultExport(exports);
}
