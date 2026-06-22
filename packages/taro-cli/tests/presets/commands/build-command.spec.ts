import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as helper from '../../../src/internal/taro-helper';
import type { IPluginContext } from '../../../src/internal/taro-service';
import buildCommand from '../../../src/presets/commands/build';

vi.mock('../../../src/doctor/validators', () => ({
  MessageKind: { Error: 'error', Warning: 'warning' },
  validateConfig: vi.fn(async () => ({ isValid: true, messages: [] })),
}));

describe('build command', () => {
  let ctx: IPluginContext;
  let registered: Record<string, { fn: (opts: Record<string, unknown>) => Promise<void> }>;
  const outputPath = '/tmp/taro-build-output';
  const configPath = '/tmp/taro-config/index.ts';

  beforeEach(() => {
    registered = {};
    ctx = {
      paths: { outputPath, configPath },
      initialConfig: {},
      helper: {
        fs: {
          existsSync: vi.fn(() => true),
          ensureDirSync: vi.fn(),
        },
        chalk: helper.chalk,
        PROJECT_CONFIG: helper.PROJECT_CONFIG,
      },
      registerCommand: vi.fn((cmd) => {
        registered[cmd.name] = cmd;
      }),
      applyPlugins: vi.fn(async () => undefined),
    } as unknown as IPluginContext;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should validate config and apply build plugins', async () => {
    buildCommand(ctx);
    await registered.build.fn({
      _: ['build'],
      options: {
        isWatch: false,
        blended: false,
        withoutBuild: false,
        noInjectGlobalStyle: false,
        noCheck: false,
        args: {},
      },
      config: {},
      isHelp: false,
    });

    expect(ctx.helper.fs.ensureDirSync).toHaveBeenCalledWith(outputPath);
    expect(ctx.applyPlugins).toHaveBeenCalledWith(expect.objectContaining({ name: 'weapp' }));
  });

  it('should exit when config file is missing', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as (code?: string | number | null) => never);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    (ctx.helper.fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

    buildCommand(ctx);
    await expect(
      registered.build.fn({
        _: ['build'],
        options: {},
        config: {},
        isHelp: false,
      }),
    ).rejects.toThrow('process.exit');

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('找不到项目配置文件'));
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });
});
