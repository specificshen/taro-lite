import { registerHooks } from 'node:module';
import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { transformSync } from '@swc/core';
import type { Config } from '@swc/core';

function getModuleDefaultExport(exports: any) {
  return exports?.__esModule ? exports.default : exports;
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

type LoadHookSync = NonNullable<Parameters<typeof registerHooks>[0]['load']>;
type ResolveHookSync = NonNullable<Parameters<typeof registerHooks>[0]['resolve']>;

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
  const macroSource = applyDefineConfigMacros(source);
  const definedSource = applyDefineConstants(macroSource, customConfig?.define);
  return transformSync(definedSource, createSwcConfig(customSwcConfig)).code || '';
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

function filePathFromURL(url: string) {
  const { pathname } = new URL(url);
  if (process.platform === 'win32' && pathname.length >= 3 && pathname[2] === ':') {
    return pathname.slice(1).replace(/\//g, path.sep);
  }
  return pathname;
}

function isScriptModuleURL(url: string) {
  if (!url.startsWith('file:')) return false;
  return SCRIPT_EXTENSIONS.includes(path.extname(filePathFromURL(url)));
}

export async function loadUserConfigModule(
  id: string,
  { customConfig = {}, customSwcConfig = {}, cwd = process.cwd() }: UserConfigModuleLoaderOptions = {},
) {
  const resolvedId = path.isAbsolute(id) ? id : path.resolve(cwd, id);

  const resolveHook: ResolveHookSync = (request, context, nextResolve) => {
    const aliasPath = resolveAlias(request, customConfig.alias);
    const resolvedRequest = aliasPath || request;

    try {
      return nextResolve(resolvedRequest, context);
    } catch (error) {
      const candidate = resolveExistingScriptPath(resolvedRequest, context.parentURL, cwd);
      if (candidate) {
        return {
          shortCircuit: true,
          url: pathToFileURL(candidate).href,
        };
      }
      throw error;
    }
  };

  const loadHook: LoadHookSync = (url, context, nextLoad) => {
    if (!isScriptModuleURL(url)) {
      return nextLoad(url, context);
    }

    const filename = filePathFromURL(url);
    return {
      format: 'commonjs',
      shortCircuit: true,
      source: transformConfigModule(filename, customConfig, customSwcConfig),
    };
  };

  const hooks = registerHooks({
    resolve: resolveHook,
    load: loadHook,
  });

  try {
    const fileURL = `${pathToFileURL(resolvedId).href}?t=${Date.now()}`;
    const mod = await import(fileURL);
    return getModuleDefaultExport(mod);
  } finally {
    hooks.deregister();
  }
}
