import { describe, expect, it } from 'bun:test';
import { getTemplateSourceType, getRootPath, getPkgVersion, isNil } from '../../util/index.js';

describe('getTemplateSourceType', () => {
  it('returns git for github prefix', () => {
    expect(getTemplateSourceType('github:NervJS/taro')).toBe('git');
  });

  it('returns git for gitlab prefix', () => {
    expect(getTemplateSourceType('gitlab:some/repo')).toBe('git');
  });

  it('returns git for direct prefix', () => {
    expect(getTemplateSourceType('direct:https://example.com/repo')).toBe('git');
  });

  it('returns url for http url', () => {
    expect(getTemplateSourceType('https://example.com/template.zip')).toBe('url');
  });
});

describe('getRootPath', () => {
  it('returns the package root directory', () => {
    const root = getRootPath();
    expect(root.endsWith('packages/taro-core')).toBe(true);
  });
});

describe('getPkgVersion', () => {
  it('returns a semver version', () => {
    const version = getPkgVersion();
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe('isNil', () => {
  it('returns true for null', () => {
    expect(isNil(null)).toBe(true);
  });

  it('returns true for undefined', () => {
    expect(isNil(undefined)).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isNil('')).toBe(false);
  });

  it('returns false for zero', () => {
    expect(isNil(0)).toBe(false);
  });
});
