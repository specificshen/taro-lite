import * as path from 'node:path';

import { type MockedFunction, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { chalk, fs, PROJECT_CONFIG, shouldUseCnpm, shouldUseYarn } from '@spcsn/taro-helper';
import { exec } from 'child_process';

import { getPkgVersion } from '../src/util';
import { run } from './utils';

const runUpdate = run('update', ['commands/update']);
const lastestVersion = getPkgVersion();

vi.mock('child_process', () => {
  const exec = vi.fn();
  exec.mockReturnValue({
    stdout: {
      on() {},
    },
    stderr: {
      on() {},
    },
  });
  return {
    __esModule: true,
    exec,
  };
});

vi.mock('ora', () => {
  const ora = vi.fn();
  ora.mockReturnValue({
    start() {
      return {
        stop() {},
        warn() {},
        succeed() {},
      };
    },
  });
  return ora;
});

vi.mock('@spcsn/taro-helper', async () => {
  const helper = await vi.importActual<typeof import('@spcsn/taro-helper')>('@spcsn/taro-helper');
  const fs = helper.fs;
  return {
    __esModule: true,
    ...helper,
    shouldUseCnpm: vi.fn(),
    shouldUseYarn: vi.fn(),
    chalk: {
      red: vi.fn(),
      green() {},
    },
    fs: {
      ...fs,
      writeJson: vi.fn(),
    },
  };
});

vi.mock('latest-version', () => () => lastestVersion);

function updatePkg(pkgPath: string, version: string) {
  let packageMap = require(pkgPath);
  packageMap = {
    ...packageMap,
    dependencies: {
      ...packageMap.dependencies,
      '@spcsn/taro-shared': version,
      '@spcsn/taro': version,
      '@spcsn/taro-cli': version,
      '@spcsn/taro-components': version,
      '@spcsn/taro-api': version,
      '@spcsn/taro-helper': version,
      '@spcsn/taro-react': version,
      '@spcsn/taro-runner-utils': version,
      '@spcsn/taro-runtime': version,
      '@spcsn/taro-service': version,
      '@spcsn/taro-plugin-platform-weapp': version,
      '@spcsn/taro-plugin-framework-react': version,
      '@spcsn/taro-plugin-generator': version,
      '@spcsn/taro-vite-runner': version,
      '@spcsn/taro-binding': version,
    },
    devDependencies: {
      ...packageMap.devDependencies,
      'babel-preset-taro': version,
      'babel-plugin-transform-taroapi': version,
      'postcss-plugin-constparse': version,
      'postcss-pxtransform': version,
    },
  };
  return packageMap;
}

describe('update', () => {
  const execMocked = exec as unknown as MockedFunction<typeof exec>;
  const shouldUseCnpmMocked = shouldUseCnpm as MockedFunction<typeof shouldUseCnpm>;
  const shouldUseYarnMocked = shouldUseYarn as MockedFunction<typeof shouldUseYarn>;
  const writeJson = fs.writeJson as MockedFunction<typeof fs.writeJson>;

  beforeEach(() => {
    shouldUseCnpmMocked.mockReturnValue(false);
    shouldUseYarnMocked.mockReturnValue(false);
  });

  afterEach(() => {
    execMocked.mockClear();
    shouldUseCnpmMocked.mockReset();
    shouldUseYarnMocked.mockReset();
    writeJson.mockClear();
  });

  it('should log errors', async () => {
    const spy = vi.spyOn(console, 'log');
    spy.mockImplementation(() => {});
    await runUpdate('', {
      options: {
        npm: 'npm',
        disableGlobalConfig: true,
      },
    });
    expect(spy).toBeCalledTimes(3);
    spy.mockRestore();
  });

  it('should update self', async () => {
    await runUpdate('', {
      args: ['self'],
      options: {
        npm: 'npm',
        disableGlobalConfig: true,
      },
    });
    expect(execMocked).toBeCalledWith(`npm i -g @spcsn/taro-cli@${lastestVersion}`);
  });

  it('should update self using yarn', async () => {
    shouldUseCnpmMocked.mockReturnValue(true);
    await runUpdate('', {
      args: ['self'],
      options: {
        npm: 'yarn',
        disableGlobalConfig: true,
      },
    });
    expect(execMocked).toBeCalledWith(`yarn global add @spcsn/taro-cli@${lastestVersion}`);
  });

  it('should update self using pnpm', async () => {
    shouldUseCnpmMocked.mockReturnValue(true);
    await runUpdate('', {
      args: ['self'],
      options: {
        npm: 'pnpm',
        disableGlobalConfig: true,
      },
    });
    expect(execMocked).toBeCalledWith(`pnpm add -g @spcsn/taro-cli@${lastestVersion}`);
  });

  it('should update self using cnpm', async () => {
    shouldUseCnpmMocked.mockReturnValue(true);
    await runUpdate('', {
      args: ['self'],
      options: {
        npm: 'cnpm',
        disableGlobalConfig: true,
      },
    });
    expect(execMocked).toBeCalledWith(`cnpm i -g @spcsn/taro-cli@${lastestVersion}`);
  });

  it('should update self to specific version', async () => {
    const version = '3.0.0-beta.0';
    await runUpdate('', {
      args: ['self', version],
      options: {
        npm: 'npm',
        disableGlobalConfig: true,
      },
    });
    expect(execMocked).toBeCalledWith(`npm i -g @spcsn/taro-cli@${version}`);
  });

  it("should throw when there isn't a Taro project", async () => {
    const chalkMocked = chalk.red as unknown as MockedFunction<any>;
    const exitSpy = vi.spyOn(process, 'exit');
    const logSpy = vi.spyOn(console, 'log');
    exitSpy.mockImplementation(() => {
      throw new Error();
    });
    logSpy.mockImplementation(() => {});
    try {
      await runUpdate('', {
        args: ['project'],
        options: {
          npm: 'npm',
          disableGlobalConfig: true,
        },
      });
    } catch (error) {} // eslint-disable-line no-empty
    expect(exitSpy).toBeCalledWith(1);
    expect(chalkMocked).toBeCalledWith(`找不到项目配置文件 ${PROJECT_CONFIG}，请确定当前目录是 Taro 项目根目录!`);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('should update project', async () => {
    const appPath = path.resolve(__dirname, 'fixtures/default');
    const pkgPath = path.join(appPath, 'package.json');
    const packageMap = updatePkg(pkgPath, lastestVersion);

    const logSpy = vi.spyOn(console, 'log');
    logSpy.mockImplementation(() => {});

    await runUpdate(appPath, {
      args: ['project'],
      options: {
        npm: 'npm',
        disableGlobalConfig: true,
      },
    });
    expect(writeJson.mock.calls[0][0]).toEqual(pkgPath);
    expect(writeJson.mock.calls[0][1]).toEqual(packageMap);
    expect(execMocked).toBeCalledWith('npm install');

    logSpy.mockRestore();
  });

  it('should update project to specific version', async () => {
    const version = '3.0.0-beta.4';
    const appPath = path.resolve(__dirname, 'fixtures/default');
    const pkgPath = path.join(appPath, 'package.json');
    const packageMap = updatePkg(pkgPath, version);

    const logSpy = vi.spyOn(console, 'log');
    logSpy.mockImplementation(() => {});

    await runUpdate(appPath, {
      args: ['project', version],
      options: {
        npm: 'npm',
        disableGlobalConfig: true,
      },
    });
    expect(writeJson.mock.calls[0][0]).toEqual(pkgPath);
    expect(writeJson.mock.calls[0][1]).toEqual(packageMap);
    expect(execMocked).toBeCalledWith('npm install');

    logSpy.mockRestore();
  });

  it('should update project with yarn', async () => {
    const appPath = path.resolve(__dirname, 'fixtures/default');

    const logSpy = vi.spyOn(console, 'log');
    logSpy.mockImplementation(() => {});
    shouldUseYarnMocked.mockReturnValue(true);

    await runUpdate(appPath, {
      args: ['project'],
      options: {
        npm: 'yarn',
        disableGlobalConfig: true,
      },
    });
    expect(execMocked).toBeCalledWith('yarn install');

    logSpy.mockRestore();
  });

  it('should update project with pnpm', async () => {
    const appPath = path.resolve(__dirname, 'fixtures/default');

    const logSpy = vi.spyOn(console, 'log');
    logSpy.mockImplementation(() => {});
    shouldUseCnpmMocked.mockReturnValue(true);

    await runUpdate(appPath, {
      args: ['project'],
      options: {
        npm: 'pnpm',
        disableGlobalConfig: true,
      },
    });
    expect(execMocked).toBeCalledWith('pnpm install');

    logSpy.mockRestore();
  });

  it('should update project with cnpm', async () => {
    const appPath = path.resolve(__dirname, 'fixtures/default');

    const logSpy = vi.spyOn(console, 'log');
    logSpy.mockImplementation(() => {});
    shouldUseCnpmMocked.mockReturnValue(true);

    await runUpdate(appPath, {
      args: ['project'],
      options: {
        npm: 'cnpm',
        disableGlobalConfig: true,
      },
    });
    expect(execMocked).toBeCalledWith('cnpm install');

    logSpy.mockRestore();
  });
});
