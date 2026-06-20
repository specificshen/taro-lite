/**
 * Modify from https://github.com/rollup/plugins/blob/master/packages/pluginutils/src/createFilter.ts
 * MIT License http://www.opensource.org/licenses/mit-license.php
 * Author Tobias Rich Harris @richard.a.harris@gmail.com
 */
import path from 'node:path';
import pm from 'picomatch';
import { isArray, isFunction } from '../../taro-shared';

type FilterPattern = ReadonlyArray<string | RegExp> | string | RegExp | null | undefined;

function ensureArray<T>(thing: T | readonly T[] | null | undefined): T[] {
  if (isArray(thing)) {
    return thing as T[];
  }
  if (thing == null) {
    return [];
  }
  return [thing as T];
}

const normalizePath = function normalizePath(filename: string): string {
  return filename.split(path.win32.sep).join(path.posix.sep);
};

function getMatcherString(id: string, resolutionBase: string | false): string {
  if (resolutionBase === false || path.isAbsolute(id) || id.startsWith('*')) {
    return normalizePath(id);
  }
  // resolve('') is valid and will default to process.cwd()
  const basePath = normalizePath(path.resolve(resolutionBase || ''))
    // escape all possible (posix + win) path characters that might interfere with regex
    .replace(/[-^$*+?.()|[\]{}]/g, '\\$&');
  // Note that we use posix.join because:
  // 1. the basePath has been normalized to use /
  // 2. the incoming glob (id) matcher, also uses /
  // otherwise Node will force backslash (\) on windows
  return path.posix.join(basePath, normalizePath(id));
}

export default function createFilter(
  include: FilterPattern,
  exclude: FilterPattern,
  options?: { resolve?: string | false },
) {
  const resolutionBase = options && options.resolve;
  const getMatcher = (id: string | RegExp) =>
    id instanceof RegExp
      ? id
      : {
          test: (what: string) => {
            // this refactor is a tad overly verbose but makes for easy debugging
            const pattern = getMatcherString(id, resolutionBase ?? '');
            const fn = pm(pattern, { dot: true });
            const result = fn(what);
            return result;
          },
        };
  const includeMatchers = ensureArray(include).map(getMatcher);
  const excludeMatchers = ensureArray(exclude).map(getMatcher);
  return function result(id: unknown) {
    if (typeof id !== 'string') {
      return false;
    }
    // 因为 vite 的虚拟模块也是 \0 开头的，会导致虚拟模块一直走不到 babel 的逻辑被过滤掉
    // if (virtualModulePrefixREG.test(id))
    //   return false
    const pathId = normalizePath(id);
    for (let i = 0; i < excludeMatchers.length; ++i) {
      const matcher = excludeMatchers[i];
      if (matcher.test(pathId)) {
        return false;
      }
    }
    for (let i = 0; i < includeMatchers.length; ++i) {
      const matcher = includeMatchers[i];
      if (matcher.test(pathId)) {
        return true;
      }
    }
    return !includeMatchers.length;
  };
}

export function createFilterWithCompileOptions(
  compile: {
    exclude?: (string | RegExp)[];
    include?: (string | RegExp)[];
    /** 对应 Vite 小程序编译链路的文件过滤配置。 */
    filter?: (filename: string) => boolean;
  } = {},
  defaultInclude: (string | RegExp)[] = [],
  defaultExclude: (string | RegExp)[] = [],
) {
  if (isFunction(compile.filter)) {
    return compile.filter;
  } else {
    let exclude: (string | RegExp)[] = [...defaultExclude];
    const include: (string | RegExp)[] = [...defaultInclude];
    if (Array.isArray(compile.include)) {
      include.unshift(...compile.include);
    }
    // Note：如果 compile 有传递 exclude，那么就进行覆盖
    if (Array.isArray(compile.exclude)) {
      exclude = [...compile.exclude];
    }
    return createFilter(include, exclude);
  }
}
