import { describe, expect, it } from 'vitest';
import { extractCompileEntry } from '../../../src/util/app-config';

describe('extractCompileEntry', () => {
  it('sets pages when --pages provided', () => {
    const appConfig: Record<string, unknown> = {};
    const ctx = { paths: { sourcePath: '/src' } } as never;

    extractCompileEntry(appConfig, { pages: 'pages/index/index,pages/detail/detail' }, ctx);

    expect(appConfig.pages).toEqual(['pages/index/index', 'pages/detail/detail']);
  });

  it('sets components when --components provided', () => {
    const appConfig: Record<string, unknown> = {};
    const ctx = { paths: { sourcePath: '/src' } } as never;

    extractCompileEntry(appConfig, { components: 'comp/a,comp/b' }, ctx);

    expect(appConfig.components).toEqual(['comp/a', 'comp/b']);
  });

  it('does nothing when no args provided', () => {
    const appConfig: Record<string, unknown> = {};
    const ctx = { paths: { sourcePath: '/src' } } as never;

    extractCompileEntry(appConfig, {}, ctx);

    expect(appConfig.pages).toBeUndefined();
    expect(appConfig.components).toBeUndefined();
  });
});
