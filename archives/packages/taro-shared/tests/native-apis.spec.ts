import { beforeEach, describe, expect, test, vi } from 'vitest';
import { processApis } from '../src/native-apis';

class TestChain {
  requestParams: Record<string, any>;
  interceptors: Array<(chain: TestChain) => Promise<unknown>>;
  index: number;

  constructor(requestParams = {}, interceptors: Array<(chain: TestChain) => Promise<unknown>> = [], index = 0) {
    this.requestParams = requestParams;
    this.interceptors = interceptors;
    this.index = index;
  }

  proceed(requestParams = {}) {
    this.requestParams = requestParams;
    const nextInterceptor = this.interceptors[this.index];
    return nextInterceptor(new TestChain(this.requestParams, this.interceptors, this.index + 1));
  }
}

class TestLink {
  taroInterceptor: (chain: TestChain) => Promise<unknown>;
  chain = new TestChain();

  constructor(interceptor: (chain: TestChain) => Promise<unknown>) {
    this.taroInterceptor = interceptor;
  }

  request(requestParams: Record<string, any> | string) {
    this.chain.interceptors = this.chain.interceptors
      .filter((interceptor) => interceptor !== this.taroInterceptor)
      .concat(this.taroInterceptor);
    return this.chain.proceed(typeof requestParams === 'string' ? { url: requestParams } : { ...requestParams });
  }

  addInterceptor(interceptor: (chain: TestChain) => Promise<unknown>) {
    this.chain.interceptors.push(interceptor);
  }

  cleanInterceptors() {
    this.chain = new TestChain();
  }
}

describe('native api request', () => {
  beforeEach(() => {
    Object.assign(globalThis, {
      getCurrentPages: vi.fn(),
      getApp: vi.fn(),
      requirePlugin: vi.fn(),
    });
  });

  test('wraps native request with promise without mutating original options', async () => {
    const nativeRequest = vi.fn((options: Record<string, any>) => {
      options.success({ data: { ok: true }, statusCode: 200 });
      return { abort: vi.fn() };
    });
    const taro: Record<string, any> = { Link: TestLink, options: {} };

    processApis(taro, { request: nativeRequest });

    const success = vi.fn();
    const complete = vi.fn();
    const options = {
      url: 'https://example.com/api',
      method: 'GET',
      success,
      complete,
    };

    const res = await taro.request(options);

    expect(res).toEqual({ data: { ok: true }, statusCode: 200 });
    expect(success).toHaveBeenCalledWith(res);
    expect(complete).not.toHaveBeenCalled();
    expect(options.success).toBe(success);
    expect(nativeRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://example.com/api',
        method: 'GET',
        success: expect.any(Function),
        fail: expect.any(Function),
        complete: expect.any(Function),
      }),
    );
  });

  test('supports string url shorthand and abort forwarding', async () => {
    const abort = vi.fn();
    let requestOptions: Record<string, any> | undefined;
    const nativeRequest = vi.fn((options: Record<string, any>) => {
      requestOptions = options;
      return { abort };
    });
    const taro: Record<string, any> = { Link: TestLink, options: {} };

    processApis(taro, { request: nativeRequest });

    const requestTask = taro.request('https://example.com/api');
    requestTask.abort();
    requestOptions?.success({ data: 'ok', statusCode: 200 });

    await expect(requestTask).resolves.toEqual({ data: 'ok', statusCode: 200 });
    expect(nativeRequest).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://example.com/api' }));
    expect(abort).toHaveBeenCalledTimes(1);
  });

  test('runs request interceptors before native request', async () => {
    const nativeRequest = vi.fn((options: Record<string, any>) => {
      options.success({ data: options.header, statusCode: 200 });
      return { abort: vi.fn() };
    });
    const taro: Record<string, any> = { Link: TestLink, options: {} };

    processApis(taro, { request: nativeRequest });
    function appendAuthInterceptor(chain: TestChain): Promise<unknown> {
      const requestParams = chain.requestParams;
      return chain.proceed({
        ...requestParams,
        header: {
          ...requestParams.header,
          Authorization: 'Bearer test-token',
        },
      });
    }

    taro.addInterceptor(appendAuthInterceptor);

    const res = await taro.request({ url: 'https://example.com/api' });

    expect(res.data).toEqual({ Authorization: 'Bearer test-token' });
    expect(nativeRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        header: { Authorization: 'Bearer test-token' },
      }),
    );
  });
});
