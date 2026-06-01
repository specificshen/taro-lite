import * as path from 'node:path';

import { type MockedFunction, type MockInstance, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { emptyDirectory } from '@spcsn/taro-helper';

import { run } from './utils';

const runBuild = run('build', ['commands/build', require.resolve('@spcsn/taro-plugin-platform-weapp')]);

vi.mock('@spcsn/taro-helper', async () => {
  const helper = await vi.importActual<typeof import('@spcsn/taro-helper')>('@spcsn/taro-helper');
  const fs = helper.fs;
  return {
    __esModule: true,
    ...helper,
    emptyDirectory: vi.fn(),
    fs: {
      ...fs,
    },
  };
});

const APP_PATH = path.join(__dirname, 'fixtures/default');
const OUTPUT_PATH = path.join(__dirname, 'fixtures/default/dist');

describe('构建配置测试', () => {
  const emptyDirectoryMocked = emptyDirectory as MockedFunction<typeof emptyDirectory>;

  beforeEach(() => {
    emptyDirectoryMocked.mockReset();
    process.argv = [];
  });

  afterEach(() => {
    process.argv = [];
    emptyDirectoryMocked.mockReset();
  });

  describe('小程序', () => {
    it(`项目 output.clean = clean: { keep: ['project.config.json'] } ==> 清空dist文件夹但保留指定文件`, async () => {
      const exitSpy = vi.spyOn(process, 'exit') as MockInstance<[], never>;
      const logSpy = vi.spyOn(console, 'log');
      const errorSpy = vi.spyOn(console, 'error');
      logSpy.mockImplementation(() => {});
      errorSpy.mockImplementation(() => {});
      exitSpy.mockImplementation(() => {
        throw new Error();
      });

      try {
        await runBuild(APP_PATH, {
          options: {
            type: 'weapp',
            platform: 'weapp',
          },
        });
      } catch (error) {
        // no handler
      }
      expect(emptyDirectoryMocked).toBeCalledWith(OUTPUT_PATH, { excludes: ['project.config.json'] });

      exitSpy.mockRestore();
      logSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });
});
