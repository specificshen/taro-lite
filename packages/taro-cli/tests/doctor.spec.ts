import { type MockInstance, describe, expect, it, vi } from 'vitest';

import { chalk } from '@spcsn/taro-helper';

import { run } from './utils';

vi.mock('../src/doctor', () => {
  return {
    __esModule: true,
    default: {
      validators: [
        () => ({
          isValid: true,
          messgaes: [
            {
              kind: 2,
              content: 'Env Success',
            },
          ],
        }),
        () =>
          Promise.resolve({
            isValid: false,
            messgaes: [
              {
                kind: 1,
                content: 'Config Error',
              },
            ],
          }),
        () => ({
          isValid: true,
          messgaes: [
            {
              kind: 2,
              content: 'Package Success',
            },
          ],
        }),
        () => ({
          isValid: true,
          messgaes: [
            {
              kind: 2,
              content: 'recommend Success',
            },
          ],
        }),
        async () => ({
          isValid: true,
          messgaes: [
            {
              kind: 2,
              content: 'doctor Success',
            },
          ],
        }),
      ],
    },
  };
});

vi.mock('ora', () => {
  const ora = vi.fn();
  ora.mockReturnValue({
    start() {
      return {
        succeed() {},
      };
    },
  });
  return ora;
});

const runDoctor = run('doctor', ['commands/doctor']);

describe('doctor', () => {
  it("should exit because there isn't a Taro project", async () => {
    const exitSpy = vi.spyOn(process, 'exit') as MockInstance<[], never>;
    const logSpy = vi.spyOn(console, 'log');

    exitSpy.mockImplementation(() => {
      throw new Error();
    });
    logSpy.mockImplementation(() => {});
    try {
      await runDoctor('', { options: { disableGlobalConfig: true } });
    } catch (error) {} // eslint-disable-line no-empty

    expect(exitSpy).toBeCalledWith(1);
    expect(logSpy).toBeCalledWith(chalk.red('找不到项目配置文件config/index，请确定当前目录是 Taro 项目根目录!'));

    exitSpy.mockRestore();
    logSpy.mockRestore();
  });
});
