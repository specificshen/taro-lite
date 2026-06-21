import { describe, expect, it } from 'vitest';
import {
  convertPluginsToObject,
  filterGlobalConfig,
  getPluginPath,
  isNpmPkg,
  mergePlugins,
} from '../../../src/internal/taro-service/utils/index';

describe('taro-service utils', () => {
  describe('isNpmPkg', () => {
    it('returns true for package names', () => {
      expect(isNpmPkg('lodash')).toBe(true);
      expect(isNpmPkg('@spcsn/taro')).toBe(true);
    });

    it('returns false for relative or absolute paths', () => {
      expect(isNpmPkg('./foo')).toBe(false);
      expect(isNpmPkg('/foo')).toBe(false);
    });
  });

  describe('getPluginPath', () => {
    it('returns package name as-is', () => {
      expect(getPluginPath('@spcsn/taro-plugin-platform-weapp')).toBe('@spcsn/taro-plugin-platform-weapp');
    });

    it('returns absolute path as-is', () => {
      expect(getPluginPath('/abs/path/to/plugin')).toBe('/abs/path/to/plugin');
    });

    it('throws for relative path', () => {
      expect(() => getPluginPath('./relative/plugin')).toThrow('plugin 和 preset 配置必须为绝对路径或者包名');
    });
  });

  describe('convertPluginsToObject', () => {
    it('converts string plugins to null options', () => {
      const result = convertPluginsToObject(['a', 'b'])();
      expect(result).toEqual({ a: null, b: null });
    });

    it('converts tuple plugins to provided options', () => {
      const result = convertPluginsToObject([['a', { x: 1 }]])();
      expect(result).toEqual({ a: { x: 1 } });
    });

    it('returns empty object for empty array', () => {
      expect(convertPluginsToObject([])()).toEqual({});
    });
  });

  describe('mergePlugins', () => {
    it('merges source plugins into dist plugins', () => {
      const merged = mergePlugins(['a'], [['b', { x: 1 }]])();
      expect(merged).toEqual({ a: null, b: { x: 1 } });
    });

    it('lets source override dist for same plugin', () => {
      const merged = mergePlugins([['a', { x: 1 }]], [['a', { y: 2 }]])();
      expect(merged).toEqual({ a: { x: 1, y: 2 } });
    });
  });

  describe('filterGlobalConfig', () => {
    it('returns config unchanged when command is provided', () => {
      const config = { plugins: ['@jdtaro/plugin-build-weapp'] } as any;
      expect(filterGlobalConfig(config, 'build')).toEqual(config);
    });

    it('filters out unrelated plugins when command is empty', () => {
      const config = {
        plugins: ['@jdtaro/plugin-build-weapp', '@jdtaro/plugin-build-h5', 'other-plugin'],
      } as any;
      expect(filterGlobalConfig(config, '')).toEqual({ plugins: ['other-plugin'] });
    });
  });
});
