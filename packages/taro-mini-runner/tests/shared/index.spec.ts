import { describe, expect, it, vi } from 'vitest';
import { getCSSModulesOptions } from '../../src/shared';
import { logger } from '../../src/shared/logger';

describe('shared / getCSSModulesOptions', () => {
  it('returns false when cssModules is not enabled', () => {
    expect(getCSSModulesOptions({} as any)).toBe(false);
    expect(getCSSModulesOptions({ postcss: {} } as any)).toBe(false);
    expect(getCSSModulesOptions({ postcss: { cssModules: { enable: false } } } as any)).toBe(false);
  });

  it('uses the default hex hash when no user config is provided', () => {
    const options = getCSSModulesOptions({
      postcss: { cssModules: { enable: true } },
    } as any);
    expect(options).toEqual({ generateScopedName: '[hash:hex:8]' });
  });

  it('keeps a user-provided hex hash pattern', () => {
    const options = getCSSModulesOptions({
      postcss: {
        cssModules: {
          enable: true,
          config: { generateScopedName: '[name]__[local]___[hash:hex:6]' },
        },
      },
    } as any);
    expect(options).toEqual({
      generateScopedName: '[name]__[local]___[hash:hex:6]',
    });
  });

  it('replaces base64 hash with hex hash and warns', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const options = getCSSModulesOptions({
      postcss: {
        cssModules: {
          enable: true,
          config: { generateScopedName: '[name]__[local]___[hash:base64:5]' },
        },
      },
    } as any);
    expect(options).toEqual({
      generateScopedName: '[name]__[local]___[hash:hex:8]',
    });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[name]__[local]___[hash:base64:5]'));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[name]__[local]___[hash:hex:8]'));
    warnSpy.mockRestore();
  });

  it('replaces multiple base64 hash placeholders', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const options = getCSSModulesOptions({
      postcss: {
        cssModules: {
          enable: true,
          config: { generateScopedName: '[hash:base64:4]-[hash:base64:5]' },
        },
      },
    } as any);
    expect(options).toEqual({
      generateScopedName: '[hash:hex:8]-[hash:hex:8]',
    });
    warnSpy.mockRestore();
  });
});
