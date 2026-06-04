import Module from 'node:module';
import path from 'node:path';

import { Config, transformSync } from '@swc/core';
import { defaults } from 'lodash';
import requireFromString from 'require-from-string';

import { fs } from '../utils';

type Loader = 'js' | 'jsx' | 'ts' | 'tsx' | 'json';

export const defaultEsbuildLoader: Record<string, Loader> = {
  '.js': 'js',
  '.jsx': 'tsx',
  '.ts': 'ts',
  '.json': 'json',
};

export interface IRequireWithEsbuildOptions {
  customConfig?: {
    alias?: Record<string, string>;
    define?: Record<string, string>;
    loader?: Record<string, Loader>;
  };
  customSwcConfig?: Config;
  cwd?: string;
}

const SCRIPT_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

type ModuleWithInternals = typeof Module & {
  _extensions: NodeJS.RequireExtensions;
  _resolveFilename: (...args: any[]) => string;
};

type ConfigModule = NodeJS.Module & {
  _compile(code: string, filename: string): void;
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

function createSwcConfig(filename: string, customSwcConfig: Config = {}): Config {
  return defaults(customSwcConfig, {
    filename,
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
  });
}

function transformConfigModule(
  filename: string,
  customConfig: IRequireWithEsbuildOptions['customConfig'],
  customSwcConfig: Config,
) {
  const source = fs.readFileSync(filename, 'utf-8');
  const definedSource = applyDefineConstants(source, customConfig?.define);
  return transformSync(definedSource, createSwcConfig(filename, customSwcConfig)).code || '';
}

/** 兼容旧 API 名称的 SWC require 实现 */
export function requireWithEsbuild(
  id: string,
  { customConfig = {}, customSwcConfig = {}, cwd = process.cwd() }: IRequireWithEsbuildOptions = {},
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
    return requireFromString(transformConfigModule(resolvedId, customConfig, customSwcConfig), resolvedId);
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

export * from './utils';
