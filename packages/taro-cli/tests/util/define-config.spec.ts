import { describe, expect, it } from 'vitest';
import { defineConfig } from '../../src/util/define-config';

describe('defineConfig', () => {
  it('returns a plain config object as-is', () => {
    const config = { compiler: 'vite' };
    expect(defineConfig(config)).toBe(config);
  });

  it('returns a config function as-is', () => {
    const fn = () => ({ compiler: 'vite' });
    expect(defineConfig(fn)).toBe(fn);
  });

  it('returns a promise as-is', async () => {
    const promise = Promise.resolve({ compiler: 'vite' });
    expect(defineConfig(promise)).toBe(promise);
    expect(await defineConfig(promise)).toEqual({ compiler: 'vite' });
  });
});
