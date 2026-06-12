import { isFunction } from '@spcsn/taro-shared';
import type Chain from './chain';

type AbortablePromise<T> = Promise<T> & {
  abort?: (cb?: () => void) => unknown;
};

function attachAbort<T>(source: AbortablePromise<T> | undefined, target: Promise<T>): AbortablePromise<T> {
  const abortableTarget = target as AbortablePromise<T>;
  if (isFunction(source?.abort)) {
    abortableTarget.abort = source.abort;
  }
  return abortableTarget;
}

export function timeoutInterceptor<T>(chain: Chain<T>) {
  const requestParams = chain.requestParams;
  let proceedPromise: AbortablePromise<T> | undefined;
  const res = new Promise<T>((resolve, reject) => {
    const timeout: ReturnType<typeof setTimeout> = setTimeout(
      () => {
        clearTimeout(timeout);
        proceedPromise?.abort?.();
        reject(new Error('网络链接超时,请稍后再试！'));
      },
      (requestParams && requestParams.timeout) || 60000,
    );

    proceedPromise = chain.proceed(requestParams);
    proceedPromise
      .then((res) => {
        if (!timeout) return;
        clearTimeout(timeout);
        resolve(res);
      })
      .catch((err) => {
        timeout && clearTimeout(timeout);
        reject(err);
      });
  });
  return attachAbort(proceedPromise, res);
}

export function logInterceptor<T>(chain: Chain<T>) {
  const requestParams = chain.requestParams;
  const { method, data, url } = requestParams;

  globalThis.console.log(`http ${method || 'GET'} --> ${url} data: `, data);

  const p = chain.proceed(requestParams);
  const res = p.then((res) => {
    globalThis.console.log(`http <-- ${url} result:`, res);
    return res;
  });
  return attachAbort(p, res);
}
