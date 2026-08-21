import { describe, expect, it } from 'bun:test';
import { extractCompileEntry } from '../../../src/util/app-config';

describe('extractCompileEntry', () => {
  it('sets pages when --pages provided', () => {
    const appConfig: Record<string, unknown> = {};

    extractCompileEntry(appConfig, { pages: 'pages/index/index,pages/detail/detail' });

    expect(appConfig.pages).toEqual(['pages/index/index', 'pages/detail/detail']);
  });

  it('does nothing when no args provided', () => {
    const appConfig: Record<string, unknown> = {};

    extractCompileEntry(appConfig, {});

    expect(appConfig.pages).toBeUndefined();
  });
});
