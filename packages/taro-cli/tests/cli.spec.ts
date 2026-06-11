import { type MockedClass, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Kernel } from '@spcsn/taro-service';
import CLI from '../src/cli';
import { getPkgVersion } from '../src/util';

vi.mock('@spcsn/taro-service');
const MockedKernel = Kernel as unknown as MockedClass<typeof Kernel>;
const APP_PATH = '/a/b/c';

function setProcessArgv(cmd: string) {
  process.argv = ['node', ...cmd.split(' ')];
}

describe('cli', () => {
  let cli: CLI;

  beforeAll(() => {
    cli = new CLI(APP_PATH);
  });

  beforeEach(() => {
    MockedKernel.mockClear();
    process.argv = [];
    delete process.env.NODE_ENV;
    delete process.env.TARO_ENV;
  });

  afterEach(() => {
    MockedKernel.mockClear();
    process.argv = [];
    delete process.env.NODE_ENV;
    delete process.env.TARO_ENV;
  });

  describe('build', () => {
    const baseOpts = {
      _: ['build'],
      options: {
        args: expect.any(Object),
        platform: undefined,
        isWatch: false,
        withoutBuild: false,
        env: undefined,
        blended: false,
        isBuildNativeComp: false,
        newBlended: false,
        noInjectGlobalStyle: false,
        noCheck: false,
      },
      isHelp: false,
    };

    it('should make configs with default weapp platform', async () => {
      const platform = 'weapp';
      setProcessArgv('taro build --watch --port 8080');
      await cli.run();
      const ins = MockedKernel.mock.instances[0];

      const opts = Object.assign({}, baseOpts);
      opts.options = Object.assign({}, baseOpts.options, {
        platform,
        isWatch: true,
        port: 8080,
        deviceType: undefined,
        qr: false,
      });

      expect(ins.run).toHaveBeenCalledWith({
        name: 'build',
        opts,
      });
    });

    it('should not set node env again', async () => {
      process.env.NODE_ENV = 'development';
      setProcessArgv('taro build --type weapp');
      await cli.run();
      expect(process.env.NODE_ENV).toEqual('development');
    });
  });

  describe('init', () => {
    it('should make configs', async () => {
      const projectName = 'temp';
      const templateSource = 'https://url';
      const template = 'mobx';
      const css = 'none';
      setProcessArgv('taro init temp --template-source=https://url --clone --template mobx --css none');
      await cli.run();
      const ins = MockedKernel.mock.instances[0];
      expect(ins.run).toHaveBeenCalledWith({
        name: 'init',
        opts: {
          _: ['init', 'temp'],
          options: {
            appPath: APP_PATH,
            projectName,
            typescript: undefined,
            templateSource,
            description: undefined,
            clone: true,
            template,
            css,
          },
          isHelp: false,
        },
      });
    });

    it('should set project name', async () => {
      const projectName = 'demo';
      setProcessArgv('taro init --name demo');
      await cli.run();
      const ins = MockedKernel.mock.instances[0];
      expect(ins.run).toHaveBeenCalledWith({
        name: 'init',
        opts: {
          _: ['init'],
          options: {
            appPath: APP_PATH,
            projectName,
            typescript: undefined,
            templateSource: undefined,
            description: undefined,
            clone: false,
            template: undefined,
            css: undefined,
          },
          isHelp: false,
        },
      });
    });
  });

  describe('unsupported commands', () => {
    it('should skip commands other than build and init', async () => {
      const spy = vi.spyOn(console, 'log');
      spy.mockImplementation(() => {});

      setProcessArgv('taro inspect entry --type weapp');
      await cli.run();

      expect(MockedKernel).not.toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith('当前 CLI 仅支持 build 和 init 命令。');

      spy.mockRestore();
    });
  });

  describe('others', () => {
    it('should log helps', async () => {
      const spy = vi.spyOn(console, 'log');
      spy.mockImplementation(() => {});

      setProcessArgv('taro -h');
      await cli.run();
      expect(spy).toBeCalledTimes(9);

      spy.mockRestore();
    });

    it('should log version', async () => {
      const spy = vi.spyOn(console, 'log');
      spy.mockImplementation(() => {});

      setProcessArgv('taro -v');
      await cli.run();
      expect(spy).toBeCalledWith(getPkgVersion());

      spy.mockRestore();
    });
  });
});
