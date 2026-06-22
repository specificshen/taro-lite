import { transformSync } from '@swc/core';
import { addHook } from 'pirates';

type SwcOnlyMatcher = string | RegExp | ((filename: string) => boolean);
type SwcPlugin = [string, Record<string, unknown>];

interface ICreateSwcRegisterParam {
  only: SwcOnlyMatcher[];
  plugins?: SwcPlugin[];
}

const HOOK_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.es6', '.es'];

function makeMatcher(matcher: SwcOnlyMatcher) {
  if (typeof matcher === 'function') {
    return matcher;
  }
  if (matcher instanceof RegExp) {
    return (filename: string) => matcher.test(filename);
  }
  return (filename: string) => filename.includes(matcher);
}

function compile(code: string, filename: string, plugins?: SwcPlugin[]) {
  const { code: transformed } = transformSync(code, {
    filename,
    jsc: {
      parser: {
        syntax: 'typescript',
        decorators: true,
      },
      transform: {
        legacyDecorator: true,
      },
      experimental: plugins ? { plugins } : undefined,
    },
    module: {
      type: 'commonjs',
    },
    sourceMaps: 'inline',
  });
  return transformed;
}

export default function createSwcRegister({ only, plugins }: ICreateSwcRegisterParam) {
  const matchers = only.map(makeMatcher);
  addHook((code, filename) => compile(code, filename, plugins), {
    exts: HOOK_EXTENSIONS,
    matcher: (filename) => matchers.some((m) => m(filename)),
  });
}
