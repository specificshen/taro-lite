import { describe, expect, it, vi } from 'vitest';
import type { IPluginContext } from '../../../src/internal/taro-service';
import buildHooksPreset from '../../../src/presets/hooks/build';

describe('build hooks preset', () => {
  it('should register all build lifecycle hooks', () => {
    const registered: string[] = [];
    const ctx = {
      registerMethod: vi.fn((name: string) => {
        registered.push(name);
      }),
    } as unknown as IPluginContext;

    buildHooksPreset(ctx);

    expect(registered).toContain('modifyAppConfig');
    expect(registered).toContain('modifyViteConfig');
    expect(registered).toContain('onBuildStart');
    expect(registered).toContain('onBuildFinish');
    expect(registered).toContain('onBuildComplete');
    expect(registered).toHaveLength(10);
  });
});
