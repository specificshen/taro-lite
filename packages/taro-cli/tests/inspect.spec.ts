import * as path from 'node:path';

import { type MockedFunction, type MockInstance, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { chalk, fs } from '@spcsn/taro-helper';

import { run } from './utils';

vi.mock('cli-highlight', () => {
  return {
    __esModule: true,
    default(str: string) {
      return str;
    },
  };
});

vi.mock('@spcsn/taro-helper', async () => {
  const helper = await vi.importActual<typeof import('@spcsn/taro-helper')>('@spcsn/taro-helper');
  const fs = helper.fs;
  return {
    __esModule: true,
    ...helper,
    fs: {
      ...fs,
      writeFileSync: vi.fn(),
    },
  };
});

const runInspect = run('inspect', [
  'commands/build',
  'commands/inspect',
  require.resolve('@spcsn/taro-plugin-platform-weapp'),
]);

describe('inspect', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("should exit because there isn't a Taro project", async () => {
    const exitSpy = vi.spyOn(process, 'exit') as MockInstance<[], never>;
    const logSpy = vi.spyOn(console, 'log');

    exitSpy.mockImplementation(() => {
      throw new Error();
    });
    logSpy.mockImplementation(() => {});

    try {
      await runInspect('');
    } catch (error) {} // eslint-disable-line no-empty

    expect(exitSpy).toBeCalledWith(1);
    expect(logSpy).toBeCalledWith(chalk.red('找不到项目配置文件config/index，请确定当前目录是 Taro 项目根目录!'));

    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it("should exit when user haven't pass correct type", async () => {
    const exitSpy = vi.spyOn(process, 'exit') as MockInstance<[], never>;
    const logSpy = vi.spyOn(console, 'log');

    exitSpy.mockImplementation(() => {
      throw new Error();
    });
    logSpy.mockImplementation(() => {});

    try {
      await runInspect(path.resolve(__dirname, 'fixtures/default'));
    } catch (error) {} // eslint-disable-line no-empty

    expect(exitSpy).toBeCalledWith(0);
    expect(logSpy).toBeCalledWith(chalk.red('请传入正确的编译类型！'));

    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('should log config', async () => {
    const exitSpy = vi.spyOn(process, 'exit') as MockInstance<[], never>;
    const logSpy = vi.spyOn(console, 'info');

    exitSpy.mockImplementation(() => {
      throw new Error();
    });
    logSpy.mockImplementation(() => {});

    try {
      const appPath = path.resolve(__dirname, 'fixtures/default');
      await runInspect(appPath, {
        options: {
          type: 'weapp',
        },
      });
    } catch (error) {} // eslint-disable-line no-empty

    expect(exitSpy).toBeCalledWith(0);
    expect(logSpy).toBeCalledTimes(1);

    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('should log specific config', async () => {
    const exitSpy = vi.spyOn(process, 'exit') as MockInstance<[], never>;
    const logSpy = vi.spyOn(console, 'info');
    const errorSpy = vi.spyOn(console, 'error');

    exitSpy.mockImplementation(() => {
      throw new Error();
    });
    logSpy.mockImplementation(() => {});
    errorSpy.mockImplementation(() => {});

    try {
      const appPath = path.resolve(__dirname, 'fixtures/default');
      await runInspect(appPath, {
        options: {
          type: 'weapp',
        },
        args: ['resolve.mainFields.0'],
      });
    } catch (error) {} // eslint-disable-line no-empty

    expect(exitSpy).toBeCalledWith(0);
    expect(logSpy).toBeCalledTimes(1);
    expect(logSpy).toBeCalledWith("'browser'");

    exitSpy.mockRestore();
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('should output config', async () => {
    const exitSpy = vi.spyOn(process, 'exit') as MockInstance<[], never>;
    const writeFileSync = fs.writeFileSync as MockedFunction<any>;
    const outputPath = 'project-config.js';

    exitSpy.mockImplementation(() => {
      throw new Error();
    });

    try {
      const appPath = path.resolve(__dirname, 'fixtures/default');
      await runInspect(appPath, {
        options: {
          type: 'weapp',
          output: outputPath,
        },
        args: ['resolve.mainFields.0'],
      });
    } catch (error) {} // eslint-disable-line no-empty

    expect(exitSpy).toBeCalledWith(0);
    expect(writeFileSync).toBeCalledWith(outputPath, "'browser'");

    exitSpy.mockRestore();
  });
});
