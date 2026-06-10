import Module from 'node:module';
import * as fs from 'node:fs';
import path from 'node:path';
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

type ModuleWithInternals = typeof Module & {
  _extensions: NodeJS.RequireExtensions;
  _nodeModulePaths(from: string): string[];
  _resolveFilename: (...args: any[]) => string;
};

type ConfigModule = NodeJS.Module & {
  _compile(code: string, filename: string): void;
  paths: string[];
};

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

function requireFromCode(code: string, filename: string) {
  const nodeModule = Module as ModuleWithInternals;
  const configModule = new Module(filename) as ConfigModule;
  configModule.filename = filename;
  configModule.paths = nodeModule._nodeModulePaths(path.dirname(filename));
  require.cache[filename] = configModule;

  try {
    configModule._compile(code, filename);
    return configModule.exports;
  } catch (error) {
    delete require.cache[filename];
    throw error;
  }
}

export function loadUserConfigModule(
  id: string,
  { customConfig = {}, customSwcConfig = {}, cwd = process.cwd() }: UserConfigModuleLoaderOptions = {},
) {
  const nodeModule = Module as ModuleWithInternals;
  const moduleExtensions = nodeModule._extensions;
  const originalResolveFilename = nodeModule._resolveFilename;
  const originalHandlers = new Map(SCRIPT_EXTENSIONS.map((extension) => [extension, moduleExtensions[extension]]));

  nodeModule._resolveFilename = function resolveFilename(
    request: string,
    parent: NodeModule,
    isMain: boolean,
    options: any,
  ) {
    const aliasPath = resolveAlias(request, customConfig.alias);
    const resolvedRequest = aliasPath || request;
    try {
      return originalResolveFilename.call(this, resolvedRequest, parent, isMain, options);
    } catch (error) {
      for (const extension of SCRIPT_EXTENSIONS) {
        const candidate = path.isAbsolute(resolvedRequest)
          ? `${resolvedRequest}${extension}`
          : path.resolve(parent?.path || cwd, `${resolvedRequest}${extension}`);
        if (fs.existsSync(candidate)) return candidate;
      }
      throw error;
    }
  };

  SCRIPT_EXTENSIONS.forEach((extension) => {
    moduleExtensions[extension] = function compileConfigModule(module: NodeJS.Module, filename: string) {
      const code = transformConfigModule(filename, customConfig, customSwcConfig);
      (module as ConfigModule)._compile(code, filename);
    };
  });

  try {
    const resolvedId = path.isAbsolute(id) ? id : path.resolve(cwd, id);
    delete require.cache[resolvedId];
    return requireFromCode(transformConfigModule(resolvedId, customConfig, customSwcConfig), resolvedId);
  } finally {
    nodeModule._resolveFilename = originalResolveFilename;
    originalHandlers.forEach((handler, extension) => {
      if (handler) {
        moduleExtensions[extension] = handler;
      } else {
        delete moduleExtensions[extension];
      }
    });
  }
}
