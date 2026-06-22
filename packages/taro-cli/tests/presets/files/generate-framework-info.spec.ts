import { describe, expect, it, vi } from 'vitest';
import * as helper from '../../../src/internal/taro-helper';
import type { IPluginContext } from '../../../src/internal/taro-service';
import generateFrameworkInfoPreset from '../../../src/presets/files/generate-framework-info';

describe('generateFrameworkInfo preset', () => {
  function makeCtx({ installedVersion }: { installedVersion: string | null }) {
    const written: { filePath: string; content: string }[] = [];
    const ctx = {
      paths: { nodeModulesPath: '/fake/node_modules' },
      initialConfig: { date: '2026-06-06', outputRoot: 'dist' },
      helper: {
        getInstalledNpmPkgVersion: vi.fn(() => installedVersion),
        printLog: vi.fn(),
        processTypeEnum: helper.processTypeEnum,
        chalk: { red: (s: string) => s },
      },
      registerMethod: vi.fn((name: string, fn) => {
        (ctx as unknown as { registered: Record<string, () => void> }).registered[name] = fn;
      }),
      writeFileToDist: vi.fn((payload) => {
        written.push(payload);
      }),
    } as unknown as IPluginContext & { registered: Record<string, () => void> };
    ctx.registered = {};
    return { ctx, written };
  }

  it('should write framework info when runtime is installed', () => {
    const { ctx, written } = makeCtx({ installedVersion: '1.2.3' });
    generateFrameworkInfoPreset(ctx);
    ctx.registered.generateFrameworkInfo();

    expect(ctx.helper.getInstalledNpmPkgVersion).toHaveBeenCalledWith('@spcsn/taro/runtime', '/fake/node_modules');
    expect(written).toHaveLength(1);
    expect(written[0].filePath).toBe('.frameworkinfo');
    const parsed = JSON.parse(written[0].content);
    expect(parsed.toolName).toBe('Taro');
    expect(parsed.toolFrameworkVersion).toBe('1.2.3');
    expect(typeof parsed.createTime).toBe('number');
  });

  it('should warn when runtime is not installed', () => {
    const { ctx, written } = makeCtx({ installedVersion: null });
    generateFrameworkInfoPreset(ctx);
    ctx.registered.generateFrameworkInfo();

    expect(written).toHaveLength(0);
    expect(ctx.helper.printLog).toHaveBeenCalledWith(
      helper.processTypeEnum.WARNING,
      '依赖安装',
      expect.stringContaining('@spcsn/taro/runtime'),
    );
  });
});
