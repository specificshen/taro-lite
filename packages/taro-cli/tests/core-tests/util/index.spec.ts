import { describe, expect, it } from 'vitest';
import { getPkgVersion, getRootPath, isNil } from '../../../src/util/index';

describe('getRootPath', () => {
  it('returns the package root directory', () => {
    const root = getRootPath();
    expect(root.endsWith('packages/taro-cli')).toBe(true);
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
