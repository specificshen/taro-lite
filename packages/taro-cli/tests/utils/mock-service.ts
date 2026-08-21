import { mock } from 'bun:test';

/**
 * taro-service 的手写 mock（bun:test 没有 vitest automock，
 * 且 bun 的 mock 函数被 new 调用时不会执行实现体，因此用真实 class + mock 方法）。
 * mock.module 会覆盖已加载模块的同名导出，cli.ts 运行期读取绑定即可拿到 mock。
 */
export function mockTaroService(modulePath: string) {
  const kernelInstances: Array<{ run: ReturnType<typeof mock> } & Record<string, unknown>> = [];

  class MockConfig {
    init = mock(async () => {});
  }

  class MockKernel {
    run = mock(async () => {});
    constructor() {
      kernelInstances.push(this as never);
    }
  }

  mock.module(modulePath, () => ({ Config: MockConfig, Kernel: MockKernel }));

  return { kernelInstances, MockConfig, MockKernel };
}
