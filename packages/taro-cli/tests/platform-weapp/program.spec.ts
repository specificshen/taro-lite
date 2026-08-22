import { describe, expect, it } from 'bun:test';
import * as helper from '../../src/internal/helper';
import type { IPluginContext } from '../../src/internal/kernel';
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
    expect(program.template.supportXS).toBe(true);
  });

  it('keeps focus double-template only for editor under Skyline', () => {
    const ctx = makeCtx();
    const program = new Weapp(ctx, {});
    program.modifyTemplate();

    // input/textarea 的 focus 走响应式绑定（单模板），不再销毁重建原生节点
    expect(program.template.focusComponents.has('input')).toBe(false);
    expect(program.template.focusComponents.has('textarea')).toBe(false);
    // editor 未验证，保留双模板
    expect(program.template.focusComponents.has('editor')).toBe(true);
  });
});
