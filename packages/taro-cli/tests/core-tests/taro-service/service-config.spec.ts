import type { IProjectConfig } from '@spcsn/taro/types/compile';
import { describe, expect, it, vi } from 'vitest';
import Config from '../../../src/internal/taro-service/service-config';

function createConfig(initialConfig: Partial<IProjectConfig> = {}) {
  const config = new Config({ appPath: '/tmp' });
  config.initialConfig = initialConfig as IProjectConfig;
  return config;
}

describe('taro-service service-config', () => {
  describe('getConfigWithNamed', () => {
    it('defaults framework to react', () => {
      const config = createConfig();
      const result = config.getConfigWithNamed('weapp', 'weapp');
      expect(result.framework).toBe('react');
    });

    it('warns and resets non-react framework to react', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const config = createConfig({ framework: 'vue' });
      const result = config.getConfigWithNamed('weapp', 'weapp');
      expect(result.framework).toBe('react');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('react'));
      warnSpy.mockRestore();
    });

    it('defaults compiler to vite', () => {
      const config = createConfig();
      const result = config.getConfigWithNamed('weapp', 'weapp');
      expect(result.compiler).toBe('vite');
    });

    it('warns and resets non-vite string compiler to vite', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const config = createConfig({ compiler: 'webpack' });
      const result = config.getConfigWithNamed('weapp', 'weapp');
      expect(result.compiler).toBe('vite');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('vite'));
      warnSpy.mockRestore();
    });

    it('warns and resets non-vite compiler type to vite', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const config = createConfig({ compiler: { type: 'webpack', custom: true } });
      const result = config.getConfigWithNamed('weapp', 'weapp');
      expect(result.compiler).toEqual({ type: 'vite', custom: true });
      warnSpy.mockRestore();
    });

    it('merges platform and config name overrides', () => {
      const config = createConfig({
        sourceRoot: 'src',
        outputRoot: 'dist',
        weapp: { defineConstants: { A: '1' } },
      });
      const result = config.getConfigWithNamed('weapp', 'weapp');
      expect(result.sourceRoot).toBe('src');
      expect(result.outputRoot).toBe('dist');
      expect(result.platform).toBe('weapp');
      expect(result.defineConstants).toEqual({ A: '1' });
    });
  });
});
