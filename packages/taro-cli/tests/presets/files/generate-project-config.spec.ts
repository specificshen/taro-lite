import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as helper from '../../../src/internal/taro-helper';
import type { IPluginContext } from '../../../src/internal/taro-service';
import generateProjectConfigPreset from '../../../src/presets/files/generate-project-config';

describe('generateProjectConfig preset', () => {
  let appPath: string;
  let sourcePath: string;
  let outputPath: string;
  let ctx: IPluginContext;
  let written: { filePath: string; content: string } | undefined;
  let registered: Record<string, (args: { srcConfigName: string; distConfigName: string }) => void>;

  beforeEach(() => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'taro-project-config-'));
    appPath = root;
    sourcePath = path.join(root, 'src');
    outputPath = path.join(root, 'dist');
    fs.mkdirSync(sourcePath);
    fs.mkdirSync(outputPath);
    written = undefined;
    registered = {};

    ctx = {
      runOpts: {},
      paths: { appPath, sourcePath, outputPath },
      helper: {
        fs: helper.fs,
        printLog: vi.fn(),
        processTypeEnum: helper.processTypeEnum,
      },
      initialConfig: { logger: { quiet: false } },
      registerMethod: vi.fn((name: string, fn) => {
        registered[name] = fn;
      }),
      writeFileToDist: vi.fn((payload) => {
        written = payload;
      }),
    } as unknown as IPluginContext;
  });

  afterEach(() => {
    fs.rmSync(appPath, { recursive: true, force: true });
    delete process.env.TARO_APP_ID;
  });

  it('should copy app-level project config and inject appid', () => {
    fs.writeFileSync(path.join(appPath, 'project.config.json'), JSON.stringify({ appid: 'wx123' }));
    generateProjectConfigPreset(ctx);
    registered.generateProjectConfig({ srcConfigName: 'project.config.json', distConfigName: 'project.config.json' });

    expect(written).toBeDefined();
    expect(written!.filePath).toBe('project.config.json');
    const parsed = JSON.parse(written!.content);
    expect(parsed.appid).toBe('wx123');
    expect(parsed.miniprogramRoot).toBe('./');
  });

  it('should fallback to source-level project config', () => {
    fs.writeFileSync(path.join(sourcePath, 'project.config.json'), JSON.stringify({ appid: 'wx456' }));
    generateProjectConfigPreset(ctx);
    registered.generateProjectConfig({ srcConfigName: 'project.config.json', distConfigName: 'project.config.json' });

    expect(JSON.parse(written!.content).appid).toBe('wx456');
  });

  it('should prefer TARO_APP_ID env over config appid', () => {
    process.env.TARO_APP_ID = 'wxenv';
    fs.writeFileSync(path.join(appPath, 'project.config.json'), JSON.stringify({ appid: 'wx123' }));
    generateProjectConfigPreset(ctx);
    registered.generateProjectConfig({ srcConfigName: 'project.config.json', distConfigName: 'project.config.json' });

    expect(JSON.parse(written!.content).appid).toBe('wxenv');
  });

  it('should skip when blended mode is enabled', () => {
    (ctx.runOpts as { blended: boolean }).blended = true;
    generateProjectConfigPreset(ctx);
    registered.generateProjectConfig({ srcConfigName: 'project.config.json', distConfigName: 'project.config.json' });

    expect(written).toBeUndefined();
  });

  it('should not add miniprogramRoot for plugin compileType', () => {
    fs.writeFileSync(
      path.join(appPath, 'project.config.json'),
      JSON.stringify({ appid: 'wxplugin', compileType: 'plugin' }),
    );
    generateProjectConfigPreset(ctx);
    registered.generateProjectConfig({ srcConfigName: 'project.config.json', distConfigName: 'project.config.json' });

    const parsed = JSON.parse(written!.content);
    expect(parsed.appid).toBe('wxplugin');
    expect(parsed).not.toHaveProperty('miniprogramRoot');
  });
});
