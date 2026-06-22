import { describe, expect, it } from 'vitest';
import * as helper from '../../src/internal/taro-helper';
import type { IPluginContext } from '../../src/internal/taro-service';
import Weapp from '../../src/platform-weapp/program';

describe('platform-weapp program', () => {
  function makeCtx() {
    return {
      path: '/fake/platform/index.js',
      helper: { recursiveMerge: helper.recursiveMerge },
      paths: { outputPath: '/fake/output' },
    } as unknown as IPluginContext;
  }

  it('initializes weapp platform with default config', () => {
    const ctx = makeCtx();
    const program = new Weapp(ctx, {});

    expect(program.platform).toBe('weapp');
    expect(program.globalObject).toBe('wx');
    expect(program.fileType).toEqual({
      templ: '.wxml',
      style: '.wxss',
      config: '.json',
      script: '.js',
      xs: '.wxs',
    });
    expect(program.projectConfigJson).toBe('project.config.json');
    expect(program.runtimePath).toBe('/fake/platform/runtime');
    expect(program.taroComponentsPath).toBe('/fake/platform/components-react');
    expect(program.getConfig()).toMatchObject({
      renderer: 'skyline',
      componentFramework: 'glass-easel',
      lazyCodeLoading: 'requiredComponents',
      style: 'v2',
    });
  });

  it('respects projectConfigName from config', () => {
    const ctx = makeCtx();
    const program = new Weapp(ctx, { projectConfigName: 'project.config.test.json' });
    expect(program.projectConfigJson).toBe('project.config.test.json');
  });

  it('modifies template with weapp-specific components', () => {
    const ctx = makeCtx();
    const program = new Weapp(ctx, {});
    program.modifyTemplate();

    expect(program.template.voidElements.has('voip-room')).toBe(true);
    expect(program.template.voidElements.has('native-slot')).toBe(true);
    expect(program.template.focusComponents.has('editor')).toBe(true);
    expect(program.template.supportXS).toBe(true);
  });
});
