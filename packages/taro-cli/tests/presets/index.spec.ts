import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import getPresets from '../../src/presets';

describe('presets index', () => {
  it('should expose file and hook plugins as absolute js paths', () => {
    const presets = getPresets();

    expect(presets.plugins.length).toBeGreaterThan(0);
    for (const plugin of presets.plugins) {
      expect(path.isAbsolute(plugin)).toBe(true);
      expect(plugin).toMatch(/presets\/(files|hooks)\/[\w-]+\.js$/);
    }
  });
});
