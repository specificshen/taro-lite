import { isFunction } from '../../type-guards';

export type ChainPromise<T = unknown> = Promise<T> & Record<string, (...args: unknown[]) => unknown>;

export type TInterceptor<T = unknown> = (c: Chain<T>) => Promise<T>;

export interface IRequestParams {
  timeout?: number;
  method?: string;
  url?: string;
  data?: unknown;
  [key: string]: unknown;
}

export default class Chain<T = unknown> {
  index: number;
  requestParams: IRequestParams;
  interceptors: TInterceptor<T>[];

  constructor(requestParams?: IRequestParams, interceptors?: TInterceptor<T>[], index?: number) {
    this.index = index || 0;
    this.requestParams = requestParams || {};
    this.interceptors = interceptors || [];
  }

  proceed(requestParams: IRequestParams = {}): ChainPromise<T> {
    this.requestParams = requestParams;
    if (this.index >= this.interceptors.length) {
      throw new Error('chain 参数错误, 请勿直接修改 request.chain');
    }
    const nextInterceptor = this._getNextInterceptor();
    const nextChain = this._getNextChain();
    const p = nextInterceptor(nextChain) as ChainPromise<T>;
    const res = p.catch((err) => Promise.reject(err)) as ChainPromise<T>;
    Object.keys(p).forEach((k) => {
      if (isFunction(p[k])) {
        res[k] = p[k];
      }
    });
    return res;
  }

  _getNextInterceptor() {
    return this.interceptors[this.index];
  }

  _getNextChain() {
    return new Chain(this.requestParams, this.interceptors, this.index + 1);
  }
}
