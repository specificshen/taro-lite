import * as path from 'node:path';

import { type MockedFunction, type MockInstance, beforeEach, describe, expect, it, vi } from 'vitest';

import { chalk, fs } from '@spcsn/taro-helper';

import doctor from '../src/doctor';

const validator = doctor.validators[3];

vi.mock('@spcsn/taro-helper', async () => {
  const helper = await vi.importActual<typeof import('@spcsn/taro-helper')>('@spcsn/taro-helper');
  const fs = helper.fs;
  return {
    __esModule: true,
    ...helper,
    fs: {
      ...fs,
      readdirSync: vi.fn(),
      existsSync: vi.fn(),
    },
  };
});

describe('recommand validator of doctor', () => {
  const existsSyncMocked = fs.existsSync as MockedFunction<typeof fs.existsSync>;
  const readdirSyncMocked = fs.readdirSync as MockedFunction<typeof fs.readdirSync>;

  beforeEach(() => {
    vi.resetModules();
    existsSyncMocked.mockReset();
    readdirSyncMocked.mockReset();
    existsSyncMocked.mockReturnValue(true);
  });

  it.skip("should exit because there isn't a Taro project", async () => {
    const exitSpy = vi.spyOn(process, 'exit') as MockInstance<[], never>;
    const logSpy = vi.spyOn(console, 'log');

    exitSpy.mockImplementation(() => {
      throw new Error();
    });
    logSpy.mockImplementation(() => {});
    existsSyncMocked.mockReturnValue(false);

    const MOCK_APP_PATH = 'src/';
    try {
      await validator({ appPath: MOCK_APP_PATH });
    } catch (error) {} // eslint-disable-line no-empty

    expect(exitSpy).toBeCalledWith(1);
    const PROJECT_PACKAGE_PATH = path.join(MOCK_APP_PATH, 'package.json');
    expect(logSpy).toBeCalledWith(chalk.red(`找不到${PROJECT_PACKAGE_PATH}，请确定当前目录是Taro项目根目录!`));

    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it.skip('should warn when test framework not found', async () => {
    vi.doMock('./fixtures/default/package.json', () => ({
      devDependencies: {
        eslint: 1,
      },
    }));
    readdirSyncMocked.mockReturnValue(['readme', '.gitignore', '.editorconfig']);

    const { lines } = await validator({ appPath: path.join(__dirname, './fixtures/default') });

    expect(lines.length).toBe(1);
    expect(lines[0].desc).toBe(
      '没有检查到常见的测试依赖(jest/mocha/ava/tape/jesmine/karma), 配置测试可以帮助提升项目质量',
    );
    expect(lines[0].valid).toBe(true);
    expect(lines[0].solution).toBe(
      '可以参考 https://github.com/NervJS/taro-ui-sample 项目, 其中已经包含了完整的测试配置与范例',
    );

    vi.unmock('./fixtures/default/package.json');
  });

  it.skip('should warn when Readme not found', async () => {
    vi.doMock('./fixtures/default/package.json', () => ({
      devDependencies: {
        mocha: 1,
        jslint: 1,
      },
    }));
    readdirSyncMocked.mockReturnValue(['.gitignore', '.editorconfig']);

    const { lines } = await validator({ appPath: path.join(__dirname, './fixtures/default') });

    expect(lines.length).toBe(1);
    expect(lines[0].desc).toBe(
      '没有检查到 Readme (readme/readme.md/readme.markdown), 编写 Readme 可以方便其他人了解项目',
    );
    expect(lines[0].valid).toBe(true);

    vi.unmock('./fixtures/default/package.json');
  });

  it.skip('should warn when .gitignore not found', async () => {
    vi.doMock('./fixtures/default/package.json', () => ({
      devDependencies: {
        jesmine: 1,
        tslint: 1,
      },
    }));
    readdirSyncMocked.mockReturnValue(['readme.markdown', '.editorconfig']);

    const { lines } = await validator({ appPath: path.join(__dirname, './fixtures/default') });

    expect(lines.length).toBe(1);
    expect(lines[0].desc).toBe(
      '没有检查到 .gitignore 配置, 配置 .gitignore 以避免将敏感信息或不必要的内容提交到代码仓库',
    );
    expect(lines[0].valid).toBe(true);

    vi.unmock('./fixtures/default/package.json');
  });

  it.skip('should warn when .editorconfig not found', async () => {
    vi.doMock('./fixtures/default/package.json', () => ({
      devDependencies: {
        karma: 1,
        jshint: 1,
      },
    }));
    readdirSyncMocked.mockReturnValue(['readme', '.gitignore']);

    const { lines } = await validator({ appPath: path.join(__dirname, './fixtures/default') });

    expect(lines.length).toBe(1);
    expect(lines[0].desc).toBe('没有检查到 .editconfig 配置, 配置 editconfig 以统一项目成员编辑器的代码风格');
    expect(lines[0].valid).toBe(true);

    vi.unmock('./fixtures/default/package.json');
  });
});
