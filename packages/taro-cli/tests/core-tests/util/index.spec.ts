import { describe, expect, it } from 'bun:test';
import { getPkgVersion, getRootPath } from '../../../src/util/index';

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
