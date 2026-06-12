import * as path from 'node:path';
import { describe, expect, test, vi } from 'vitest';
import { readConfig } from '../src/utils';

describe('readConfig', () => {
  const config = {
    pages: ['pages/index/index'],
    window: {
      backgroundTextStyle: 'light',
      navigationBarBackgroundColor: '#fff',
      navigationBarTitleText: 'WeChat',
      navigationBarTextStyle: 'black',
    },
  };
  const pageConfig = {
    navigationBarTitleText: 'index',
  };

  test('read app config without tips', async () => {
    const result = await readConfig(path.join(__dirname, './__mocks__/app.config.ts'));
    expect(result).toEqual(config);
  });

  test('read app config with tips', async () => {
    const result = await readConfig(path.join(__dirname, './__mocks__/app.define.config.ts'));
    expect(result).toEqual(config);
  });

  test('read page config without tips', async () => {
    const result = await readConfig(path.join(__dirname, './__mocks__/page.config.ts'));
    expect(result).toEqual(pageConfig);
  });

  test('read page config with tips', async () => {
    const result = await readConfig(path.join(__dirname, './__mocks__/page.define.config.ts'));
    expect(result).toEqual(pageConfig);
  });

  test('read page config with module.exports', async () => {
    const result = await readConfig(path.join(__dirname, './__mocks__/page.es5.config.ts'));
    expect(result).toEqual(pageConfig);
  });

  test('read page config with alias', async () => {
    const result = await readConfig(path.join(__dirname, './__mocks__/page.alias.config.ts'), {
      alias: {
        '@/utils': path.resolve(__dirname, './__mocks__/utils'),
      },
    });
    expect(result).toEqual({
      navigationBarTitleText: 'i18n',
    });
  });

  test('read page config with defineConstants', async () => {
    const result = await readConfig(path.join(__dirname, './__mocks__/page.define-constants.config.ts'), {
      defineConstants: {
        IS_BUILD_COMPONENT: 'true',
      },
    });
    expect(result).toEqual({
      navigationBarTitleText: 'comp',
    });
  });

  test('read config with import', async () => {
    const logSpy = vi.spyOn(console, 'log');
    logSpy.mockImplementation(() => {});

    const result = await readConfig(path.join(__dirname, './__mocks__/app.import.config.ts'));
    expect(result).toEqual(config);

    logSpy.mockRestore();
  });

  test('read config with require', async () => {
    const result = await readConfig(path.join(__dirname, './__mocks__/app.require.config.ts'));
    expect(result).toEqual(config);
  });

  test('read json config', async () => {
    const result = await readConfig(path.join(__dirname, './__mocks__/app.json'));
    expect(result).toEqual(config);
  });
});
