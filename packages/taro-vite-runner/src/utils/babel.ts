import * as babel from '@babel/core';

import type { PluginOption } from 'vite';

export interface TaroBabelInputPluginOptions extends babel.TransformOptions {
  babelHelpers?: 'bundled' | 'runtime' | 'inline' | 'external';
  extensions?: string[];
  filter?: (filename: string) => boolean;
  skipPreflightCheck?: boolean;
}

function stripQuery(id: string) {
  return id.split('?')[0];
}

export function createBabelTransformPlugin(options: TaroBabelInputPluginOptions): PluginOption {
  const {
    babelHelpers: _babelHelpers,
    extensions = ['.js', '.jsx', '.ts', '.tsx', '.es6', '.es', '.mjs', '.mts'],
    filter = () => true,
    skipPreflightCheck: _skipPreflightCheck,
    ...babelOptions
  } = options;
  void _babelHelpers;
  void _skipPreflightCheck;
  const extensionRegExp = new RegExp(
    `(${extensions.map((ext) => ext.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})$`,
  );

  return {
    name: 'taro:vite-babel-transform',
    async transform(code, id) {
      const filename = stripQuery(id);
      if (!extensionRegExp.test(filename) || !filter(filename)) return null;

      const loadedConfig = await (babel.loadPartialConfigAsync || babel.loadPartialConfig)({
        ...babelOptions,
        filename,
        sourceMaps: true,
        caller: {
          name: 'taro-vite-runner',
          supportsStaticESM: true,
          ...babelOptions.caller,
        },
      });

      if (!loadedConfig) return null;

      const result = await babel.transformAsync(code, loadedConfig.options);
      if (!result?.code) return null;

      return {
        code: result.code,
        map: result.map,
      };
    },
  };
}
