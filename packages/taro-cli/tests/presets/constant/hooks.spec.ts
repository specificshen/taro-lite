import { describe, expect, it } from 'vitest';
import * as hooks from '../../../src/presets/constant/hooks';

describe('preset hooks constants', () => {
  it('exposes lifecycle hook names', () => {
    expect(hooks.ON_BUILD_START).toBe('onBuildStart');
    expect(hooks.ON_BUILD_FINISH).toBe('onBuildFinish');
    expect(hooks.ON_BUILD_COMPLETE).toBe('onBuildComplete');
  });

  it('exposes modify hook names', () => {
    expect(hooks.MODIFY_APP_CONFIG).toBe('modifyAppConfig');
    expect(hooks.MODIFY_VITE_CONFIG).toBe('modifyViteConfig');
    expect(hooks.MODIFY_BUILD_ASSETS).toBe('modifyBuildAssets');
    expect(hooks.MODIFY_MINI_CONFIGS).toBe('modifyMiniConfigs');
    expect(hooks.MODIFY_COMPONENT_CONFIG).toBe('modifyComponentConfig');
    expect(hooks.MODIFY_RUNNER_OPTS).toBe('modifyRunnerOpts');
    expect(hooks.ON_PARSE_CREATE_ELEMENT).toBe('onParseCreateElement');
  });
});
