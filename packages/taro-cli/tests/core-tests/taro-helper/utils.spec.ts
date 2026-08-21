import { beforeEach, describe, expect, it } from 'bun:test';
import { PLATFORMS } from '../../../src/internal/helper/constants';
import {
  addPlatforms,
  getInstalledNpmPkgPath,
  getInstalledNpmPkgVersion,
  getModuleDefaultExport,
  isAliasPath,
  isEmptyObject,
  isNpmPkg,
  normalizePath,
  promoteRelativePath,
  recursiveMerge,
  removePathPrefix,
} from '../../../src/internal/helper/utils';

describe('helper utils', () => {
  describe('normalizePath', () => {
    it('replaces backslashes with slashes', () => {
      expect(normalizePath('a\\b\\c')).toBe('a/b/c');
    });

    it('collapses multiple slashes', () => {
      expect(normalizePath('a//b///c')).toBe('a/b/c');
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

  describe('recursiveMerge', () => {
    it('concatenates arrays', () => {
      expect(recursiveMerge({ a: [1] }, { a: [2] })).toEqual({ a: [1, 2] });
    });

    it('recursively merges plain objects', () => {
      expect(recursiveMerge<{ a: Record<string, number> }>({ a: { b: 1 } }, { a: { c: 2 } })).toEqual({
        a: { b: 1, c: 2 },
      });
    });

    it('overrides when types differ', () => {
      expect(recursiveMerge<{ a: unknown }>({ a: 1 }, { a: 'str' })).toEqual({ a: 'str' });
    });

    it('ignores undefined args', () => {
      expect(recursiveMerge({ a: 1 }, undefined)).toEqual({ a: 1 });
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

  describe('removePathPrefix', () => {
    it('removes root prefix', () => {
      expect(removePathPrefix('/foo/bar')).toBe('foo/bar');
    });

    it('normalizes path', () => {
      expect(removePathPrefix('./foo//bar')).toBe('foo/bar');
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
      const pkgPath = getInstalledNpmPkgPath('vite', process.cwd());
      expect(pkgPath).not.toBeNull();
      expect(pkgPath!.endsWith('package.json')).toBe(true);
    });

    it('returns null for non-existent dependency', () => {
      expect(getInstalledNpmPkgPath('this-package-does-not-exist-abc123', process.cwd())).toBeNull();
    });
  });

  describe('getInstalledNpmPkgVersion', () => {
    it('returns version for existing dependency', () => {
      const version = getInstalledNpmPkgVersion('vite', process.cwd());
      expect(version).not.toBeNull();
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('returns null for non-existent dependency', () => {
      expect(getInstalledNpmPkgVersion('this-package-does-not-exist-abc123', process.cwd())).toBeNull();
    });
  });
});
