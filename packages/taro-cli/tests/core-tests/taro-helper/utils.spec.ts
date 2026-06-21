import { beforeEach, describe, expect, it } from 'vitest';
import { PLATFORMS } from '../../../src/internal/taro-helper/constants';
import {
  addPlatforms,
  applyArrayedVisitors,
  cssImports,
  extnameExpRegOf,
  generateConstantsList,
  generateEnvList,
  getHash,
  getInstalledNpmPkgPath,
  getInstalledNpmPkgVersion,
  getModuleDefaultExport,
  isAliasPath,
  isEmptyObject,
  isNodeModule,
  isNpmPkg,
  isQuickAppPkg,
  mergeVisitors,
  normalizePath,
  pascalCase,
  promoteRelativePath,
  recursiveMerge,
  removeHeadSlash,
  removePathPrefix,
} from '../../../src/internal/taro-helper/utils';

describe('taro-helper utils', () => {
  describe('normalizePath', () => {
    it('replaces backslashes with slashes', () => {
      expect(normalizePath('a\\b\\c')).toBe('a/b/c');
    });

    it('collapses multiple slashes', () => {
      expect(normalizePath('a//b///c')).toBe('a/b/c');
    });
  });

  describe('isNodeModule', () => {
    it('returns true for node_modules path', () => {
      expect(isNodeModule('node_modules/foo/index.js')).toBe(true);
    });

    it('returns false for source path', () => {
      expect(isNodeModule('src/index.ts')).toBe(false);
    });
  });

  describe('isNpmPkg', () => {
    it('returns true for package name', () => {
      expect(isNpmPkg('lodash')).toBe(true);
      expect(isNpmPkg('@spcsn/taro')).toBe(true);
    });

    it('returns false for relative or absolute path', () => {
      expect(isNpmPkg('./foo')).toBe(false);
      expect(isNpmPkg('../foo')).toBe(false);
      expect(isNpmPkg('/foo')).toBe(false);
    });
  });

  describe('isQuickAppPkg', () => {
    it('returns true for system/service package', () => {
      expect(isQuickAppPkg('@system.router')).toBe(true);
      expect(isQuickAppPkg('@service.account')).toBe(true);
    });

    it('returns false for normal package', () => {
      expect(isQuickAppPkg('lodash')).toBe(false);
    });
  });

  describe('isAliasPath', () => {
    it('returns true when name matches alias prefix', () => {
      expect(isAliasPath('@/components', { '@': './src/' })).toBe(true);
    });

    it('returns false when no alias is configured', () => {
      expect(isAliasPath('@/components')).toBe(false);
    });

    it('returns false when name does not match alias', () => {
      expect(isAliasPath('lodash', { '@': './src/' })).toBe(false);
    });
  });

  describe('promoteRelativePath', () => {
    it('promotes single .. to .', () => {
      expect(promoteRelativePath('../foo')).toBe('./foo');
    });

    it('strips first .. when multiple', () => {
      expect(promoteRelativePath('../../foo')).toBe('../foo');
    });

    it('normalizes path with no parent segments', () => {
      expect(promoteRelativePath('./foo/bar')).toBe('./foo/bar');
    });
  });

  describe('isEmptyObject', () => {
    it('returns true for null or undefined', () => {
      expect(isEmptyObject(null)).toBe(true);
      expect(isEmptyObject(undefined)).toBe(true);
    });

    it('returns true for empty object', () => {
      expect(isEmptyObject({})).toBe(true);
    });

    it('returns false for non-empty object', () => {
      expect(isEmptyObject({ a: 1 })).toBe(false);
    });

    it('returns true for object with only inherited properties', () => {
      expect(isEmptyObject(Object.create({ a: 1 }))).toBe(true);
    });
  });

  describe('generateEnvList', () => {
    it('wraps keys with process.env prefix', () => {
      expect(generateEnvList({ NODE_ENV: 'production' })).toEqual({ 'process.env.NODE_ENV': 'production' });
    });

    it('parses JSON strings', () => {
      expect(generateEnvList({ FLAG: 'true' })).toEqual({ 'process.env.FLAG': true });
    });

    it('returns empty object for empty input', () => {
      expect(generateEnvList({})).toEqual({});
    });
  });

  describe('generateConstantsList', () => {
    it('parses string values as JSON when possible', () => {
      expect(generateConstantsList({ A: '123' })).toEqual({ A: 123 });
    });

    it('recursively processes nested objects', () => {
      expect(generateConstantsList({ A: { B: 'true' } })).toEqual({ A: { B: true } });
    });

    it('preserves non-string values', () => {
      expect(generateConstantsList({ A: 1, B: false })).toEqual({ A: 1, B: false });
    });
  });

  describe('cssImports', () => {
    it('extracts CSS import paths', () => {
      const content = "@import './a.css'; @import './b.scss';";
      expect(cssImports(content)).toEqual(['./a.css', './b.scss']);
    });

    it('ignores commented imports', () => {
      expect(cssImports("/* @import './a.css'; */ @import './b.css';")).toEqual(['./b.css']);
    });
  });

  describe('pascalCase', () => {
    it('capitalizes first letter and camelCases rest', () => {
      expect(pascalCase('hello-world')).toBe('HelloWorld');
      expect(pascalCase('foo')).toBe('Foo');
    });
  });

  describe('recursiveMerge', () => {
    it('concatenates arrays', () => {
      expect(recursiveMerge({ a: [1] }, { a: [2] })).toEqual({ a: [1, 2] });
    });

    it('recursively merges plain objects', () => {
      expect(recursiveMerge({ a: { b: 1 } }, { a: { c: 2 } })).toEqual({ a: { b: 1, c: 2 } });
    });

    it('overrides when types differ', () => {
      expect(recursiveMerge({ a: 1 }, { a: 'str' })).toEqual({ a: 'str' });
    });

    it('ignores undefined args', () => {
      expect(recursiveMerge({ a: 1 }, undefined)).toEqual({ a: 1 });
    });
  });

  describe('mergeVisitors', () => {
    it('merges enter/exit into arrays', () => {
      const enter1 = () => {};
      const enter2 = () => {};
      expect(mergeVisitors({ enter: enter1 }, { enter: enter2 })).toEqual({ enter: [enter1, enter2] });
    });

    it('recursively merges nested visitor objects', () => {
      expect(mergeVisitors({ a: { enter: 1 } }, { a: { enter: 2 } })).toEqual({ a: { enter: [1, 2] } });
    });
  });

  describe('applyArrayedVisitors', () => {
    it('turns arrays of functions into a single function', () => {
      const calls: number[] = [];
      const obj = applyArrayedVisitors({
        enter: [() => calls.push(1), () => calls.push(2)],
      });
      (obj.enter as (...args: unknown[]) => void)();
      expect(calls).toEqual([1, 2]);
    });

    it('recursively processes nested objects', () => {
      const calls: number[] = [];
      const obj = applyArrayedVisitors({
        a: {
          enter: [() => calls.push(1)],
        },
      });
      (obj.a.enter as (...args: unknown[]) => void)();
      expect(calls).toEqual([1]);
    });
  });

  describe('getHash', () => {
    it('returns 8-char hex hash', () => {
      expect(getHash('hello')).toMatch(/^[a-f0-9]{8}$/);
    });
  });

  describe('getModuleDefaultExport', () => {
    it('returns default when __esModule is true', () => {
      expect(getModuleDefaultExport({ __esModule: true, default: 'default' })).toBe('default');
    });

    it('returns exports when __esModule is missing', () => {
      expect(getModuleDefaultExport({ foo: 'bar' })).toEqual({ foo: 'bar' });
    });
  });

  describe('removeHeadSlash', () => {
    it('removes leading slash or backslash', () => {
      expect(removeHeadSlash('/foo')).toBe('foo');
      expect(removeHeadSlash('\\foo')).toBe('foo');
      expect(removeHeadSlash('foo')).toBe('foo');
    });
  });

  describe('removePathPrefix', () => {
    it('removes root prefix', () => {
      expect(removePathPrefix('/foo/bar')).toBe('foo/bar');
    });

    it('normalizes path', () => {
      expect(removePathPrefix('./foo//bar')).toBe('foo/bar');
    });
  });

  describe('extnameExpRegOf', () => {
    it('creates regex matching file extension', () => {
      expect(extnameExpRegOf('foo.ts').test('foo.ts')).toBe(true);
      expect(extnameExpRegOf('foo.ts').test('foo.js')).toBe(false);
    });
  });

  describe('addPlatforms', () => {
    let previousTT: string | undefined;

    beforeEach(() => {
      previousTT = PLATFORMS.TT;
      delete PLATFORMS.TT;
    });

    it('adds new platform in uppercase', () => {
      addPlatforms('tt');
      expect(PLATFORMS.TT).toBe('tt');
    });

    it('does not overwrite existing platform', () => {
      PLATFORMS.WEAPP = 'weapp';
      addPlatforms('weapp');
      expect(PLATFORMS.WEAPP).toBe('weapp');
    });

    it('restores previous TT state after test', () => {
      if (previousTT) {
        PLATFORMS.TT = previousTT;
      }
    });
  });

  describe('getInstalledNpmPkgPath', () => {
    it('returns package.json path for existing dependency', () => {
      const pkgPath = getInstalledNpmPkgPath('lodash', process.cwd());
      expect(pkgPath).not.toBeNull();
      expect(pkgPath!.endsWith('package.json')).toBe(true);
    });

    it('returns null for non-existent dependency', () => {
      expect(getInstalledNpmPkgPath('this-package-does-not-exist-abc123', process.cwd())).toBeNull();
    });
  });

  describe('getInstalledNpmPkgVersion', () => {
    it('returns version for existing dependency', () => {
      const version = getInstalledNpmPkgVersion('lodash', process.cwd());
      expect(version).not.toBeNull();
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('returns null for non-existent dependency', () => {
      expect(getInstalledNpmPkgVersion('this-package-does-not-exist-abc123', process.cwd())).toBeNull();
    });
  });
});
