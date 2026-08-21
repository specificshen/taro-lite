import { describe, expect, it } from 'bun:test';
import * as path from 'node:path';
import getPresets from '../../src/presets';

describe('presets index', () => {
  it('should expose file and hook plugins as absolute ts paths', () => {
    const presets = getPresets();

    expect(presets.plugins.length).toBeGreaterThan(0);
    for (const plugin of presets.plugins) {
      expect(path.isAbsolute(plugin)).toBe(true);
      expect(plugin).toMatch(/presets\/(files|hooks)\/[\w-]+\.ts$/);
    }
  });
});
