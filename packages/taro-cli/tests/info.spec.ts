import * as path from 'node:path';

import { type MockInstance, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { chalk } from '@spcsn/taro-helper';

import { getPkgVersion } from '../src/util';
import { run } from './utils';

vi.mock('envinfo', async () => {
  const envinfo = await vi.importActual<typeof import('envinfo')>('envinfo');
  return {
    __esModule: true,
    async run(data: any, options: any) {
      const res = await envinfo.run(data, { ...options, json: true });
      return JSON.parse(res as string);
    },
  };
});

const runInfo = run('info', ['commands/info']);

describe('info', () => {
  it("should exit because there isn't a Taro project", async () => {
    const exitSpy = vi.spyOn(process, 'exit') as MockInstance<[], never>;
    const logSpy = vi.spyOn(console, 'log');

    exitSpy.mockImplementation(() => {
      throw new Error();
    });
    logSpy.mockImplementation(() => {});

    try {
      await runInfo('');
    } catch (error) {} // eslint-disable-line no-empty

    expect(exitSpy).toBeCalledWith(1);
    expect(logSpy).toBeCalledWith(chalk.red('找不到项目配置文件config/index，请确定当前目录是 Taro 项目根目录!'));

    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('should log information', async () => {
    const logSpy = vi.spyOn(console, 'log');
    logSpy.mockImplementation(() => {});

    const appPath = path.resolve(__dirname, 'fixtures/default');
    await runInfo(appPath);

    expect(logSpy).toBeCalledTimes(1);
    const res = logSpy.mock.calls[0][0];
    const title = `Taro CLI ${getPkgVersion()} environment info`;
    expect(res.hasOwnProperty(title)).toBeTruthy();
    const info = res[title];
    expect('System' in info).toBeTruthy();
    expect('Binaries' in info).toBeTruthy();
    // envinfo 还不支持 yarn workspace
    // expect('npmPackages' in info).toBeTruthy()
    // Note: windows 操作系统可能不存在 System.Shell
    expect(Object.keys(info.System)).toEqual(expect.arrayContaining(['OS']));
    // Note: 环境内可能不包括 Yarn
    expect(Object.keys(info.Binaries)).toEqual(expect.arrayContaining(['Node', 'npm']));
    // expect(info.npmPackages.hasOwnProperty('@spcsn/taro-helper')).toBeTruthy()
    // expect(info.npmPackages.hasOwnProperty('@spcsn/taro-service')).toBeTruthy()
    // expect(info.npmPackages.hasOwnProperty('@spcsn/taro')).toBeTruthy()
    // expect(info.npmPackages.hasOwnProperty('@spcsn/taroize')).toBeTruthy()
    // expect(info.npmPackages.hasOwnProperty('@spcsn/taro-webpack-runner')).toBeTruthy()
    // expect(info.npmPackages.hasOwnProperty('babel-plugin-transform-taroapi')).toBeTruthy()
    // expect(info.npmPackages.hasOwnProperty('postcss-pxtransform')).toBeTruthy()

    logSpy.mockRestore();
  });
});
