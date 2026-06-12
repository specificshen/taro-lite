import Chain from './chain';
import type { ChainPromise, IRequestParams, TInterceptor } from './chain';

export default class Link<T = unknown> {
  taroInterceptor: TInterceptor<T>;
  interceptors: TInterceptor<T>[];

  constructor(interceptor: TInterceptor<T>) {
    this.taroInterceptor = interceptor;
    this.interceptors = [];
  }

  request(requestParams: IRequestParams | string): ChainPromise<T> {
    const taroInterceptor = this.taroInterceptor;
    const interceptors = this.interceptors.filter((interceptor) => interceptor !== taroInterceptor).concat(taroInterceptor);
    const chain = new Chain<T>(undefined, interceptors);

    return chain.proceed(typeof requestParams === 'string' ? { url: requestParams } : { ...requestParams });
  }

  addInterceptor(interceptor: TInterceptor<T>) {
    this.interceptors.push(interceptor);
  }

  cleanInterceptors() {
    this.interceptors = [];
  }
}

export function interceptorify<T>(promisifyApi: (requestParams: IRequestParams) => Promise<T>) {
  return new Link<T>(function (chain) {
    return promisifyApi(chain.requestParams);
  });
}
