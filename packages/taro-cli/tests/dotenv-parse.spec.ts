import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import * as path from 'node:path';
import type CLI from '../src/cli';
import { dotenvParse } from '../src/internal/helper';
import { mockTaroService } from './utils/mock-service';

// 先注册 mock 再动态加载 cli：bun 的 mock.module 不提升，
// 静态 import cli.ts 会让 kernel 的真实绑定先行固化；
// modulePath 必须传绝对路径（mock.module 按 helper 文件位置解析相对路径）
const { kernelInstances } = mockTaroService(path.resolve(__dirname, '../src/internal/kernel'));
const APP_PATH = path.join(__dirname, 'fixtures/default');

function setProcessArgv(cmd: string) {
  process.argv = ['node', ...cmd.split(' ')];
}

describe('inspect', () => {
  let cli: CLI;

  beforeAll(async () => {
    const { default: CLIClass } = await import('../src/cli');
    cli = new CLIClass(APP_PATH);
  });

  beforeEach(() => {
    kernelInstances.length = 0;
    process.argv = [];
    delete process.env.NODE_ENV;
    delete process.env.TARO_ENV;
    delete process.env.TARO_APP_TEST;
    delete process.env.TARO_APP_ID;
    delete process.env.JD_APP_TEST;
    delete process.env.TARO_APP_DEFAULT;
    delete process.env.TARO_APP_FOO;
  });

  afterEach(() => {
    kernelInstances.length = 0;
    process.argv = [];
    delete process.env.NODE_ENV;
    delete process.env.TARO_ENV;
    delete process.env.TARO_APP_TEST;
    delete process.env.TARO_APP_ID;
    delete process.env.JD_APP_TEST;
    delete process.env.TARO_APP_DEFAULT;
    delete process.env.TARO_APP_FOO;
  });

  describe('cli mode env', () => {
    it('dotenvParse .env .env.dev should success', async () => {
      expect(process.env.TARO_test).toBeUndefined();
      dotenvParse(path.resolve(__dirname, 'env'), 'TARO_', 'dev');
      expect(process.env.TARO_test).toBe('123');
      expect(process.env._TARO_test).toBeUndefined();
    });

    it('--watch true => 默认加载 .env.development', async () => {
      setProcessArgv('taro build --watch --type weapp');
      await cli.run();
      expect(process.env.TARO_APP_TEST).toEqual('env-development');
      expect(process.env.TARO_APP_DEFAULT).toEqual('default');
    });

    it('--watch false => 默认加载 .env.production', async () => {
      setProcessArgv('taro build --type weapp');
      await cli.run();
      expect(process.env.TARO_APP_TEST).toEqual('env-production');
      expect(process.env.TARO_APP_DEFAULT).toEqual('default');
    });

    it('指定加载 .env.pre', async () => {
      setProcessArgv('taro build --type weapp --mode pre');
      await cli.run();
      expect(process.env.TARO_APP_TEST).toEqual('env-pre');
      expect(process.env.TARO_APP_DEFAULT).toEqual('default');
    });

    it('env.local 比 .env 优先级更高', async () => {
      setProcessArgv('taro build --type weapp --mode find404');
      await cli.run();
      expect(process.env.TARO_APP_TEST).toEqual('env-local');
      expect(process.env.TARO_APP_DEFAULT).toEqual('default');
    });

    it('env.uat.local 比 .env.uat 优先级更高', async () => {
      setProcessArgv('taro build --type weapp --mode uat');
      await cli.run();
      expect(process.env.TARO_APP_TEST).toEqual('env-uat-local');
      expect(process.env.TARO_APP_DEFAULT).toEqual('default');
    });

    it('自定义前缀: JD_APP_', async () => {
      setProcessArgv('taro build --type weapp --mode uat --env-prefix JD_APP_');
      await cli.run();
      expect(process.env.JD_APP_TEST).toEqual('env-uat');
      expect(process.env.TARO_APP_TEST).toEqual(undefined);
      expect(process.env.TARO_APP_ID).toEqual('特殊变量appid');
    });

    it('环境变量可以相互引用', async () => {
      setProcessArgv('taro build --type weapp --mode pre');
      await cli.run();
      expect(process.env.TARO_APP_FOO).toEqual('env-pre-foo');
    });
  });
});
