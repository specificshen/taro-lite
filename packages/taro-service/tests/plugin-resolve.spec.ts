import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolvePresetsOrPlugins } from '../src/utils';
import { PluginType } from '../src/utils/constants';

const cliPackagePath = path.resolve(__dirname, '../../taro-cli');

describe('插件解析', () => {
  let appRoot: string;

  beforeEach(() => {
    appRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'taro-service-plugin-'));
    const scopePath = path.join(appRoot, 'node_modules', '@spcsn');
    fs.mkdirSync(scopePath, { recursive: true });
    fs.symlinkSync(cliPackagePath, path.join(scopePath, 'taro-cli'), 'dir');
  });

  afterEach(() => {
    fs.rmSync(appRoot, { recursive: true, force: true });
  });

  it('从 CLI 内置产物解析仍保留的历史插件包名，并忽略已移除插件', () => {
    const plugins = resolvePresetsOrPlugins(
      appRoot,
      {
        '@spcsn/taro-plugin-generator': null,
        '@spcsn/taro-plugin-platform-weapp': { useExtendedLib: { skyline: true } },
      },
      PluginType.Plugin,
    );

    expect(plugins.map((plugin) => path.relative(cliPackagePath, plugin.path))).toEqual([
      'dist/platform-weapp/index.js',
    ]);
  });

  it('按最终路径去重并合并重复插件配置', () => {
    const weappPluginPath = path.join(cliPackagePath, 'dist/platform-weapp/index.js');
    const plugins = resolvePresetsOrPlugins(
      appRoot,
      {
        [weappPluginPath]: { first: true },
        '@spcsn/taro-plugin-platform-weapp': { useExtendedLib: { skyline: true } },
      },
      PluginType.Plugin,
    );

    expect(plugins).toHaveLength(1);
    expect(plugins[0].path).toBe(weappPluginPath);
    expect(plugins[0].opts).toEqual({ first: true, useExtendedLib: { skyline: true } });
  });
});
