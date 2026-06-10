import { registerHooks } from 'node:module';
import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { transformSync } from '@swc/core';
import type { Config } from '@swc/core';

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
  };
}

function transformConfigModule(
  filename: string,
  customConfig: UserConfigModuleLoaderOptions['customConfig'],
  customSwcConfig: Config,
) {
  const source = fs.readFileSync(filename, 'utf-8');
  const definedSource = applyDefineConstants(source, customConfig?.define);
  return transformSync(definedSource, createSwcConfig(customSwcConfig)).code || '';
}

function getParentDirectory(parentURL: string | undefined, cwd: string) {
  if (!parentURL?.startsWith('file:')) {
    return cwd;
  }
  return path.dirname(fileURLToPath(parentURL));
}

function resolveExistingScriptPath(request: string, parentURL: string | undefined, cwd: string) {
  const requestPath = path.isAbsolute(request) ? request : path.resolve(getParentDirectory(parentURL, cwd), request);

  for (const extension of SCRIPT_EXTENSIONS) {
    const candidate = `${requestPath}${extension}`;
    if (fs.existsSync(candidate)) return candidate;
  }
}

function isScriptModuleURL(url: string) {
  if (!url.startsWith('file:')) return false;
  return SCRIPT_EXTENSIONS.includes(path.extname(fileURLToPath(url)));
}

export function loadUserConfigModule(
  id: string,
  { customConfig = {}, customSwcConfig = {}, cwd = process.cwd() }: UserConfigModuleLoaderOptions = {},
) {
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

    const filename = fileURLToPath(url);
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
    const resolvedId = path.isAbsolute(id) ? id : path.resolve(cwd, id);
    delete require.cache[require.resolve(resolvedId)];
    return require(resolvedId);
  } finally {
    hooks.deregister();
  }
}
