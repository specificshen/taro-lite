import { Current, eventCenter, Events, getCurrentInstance, nextTick, options } from '@spcsn/taro-runtime';
import { ENV_TYPE as envType, getEnv } from './env';
import Link, { interceptorify } from './interceptor';
import { logInterceptor, timeoutInterceptor } from './interceptor/interceptors';
import { Behavior, getInitPxTransform, getPreload, getPxTransform } from './tools';

const interceptors = {
  logInterceptor,
  timeoutInterceptor,
};

const Taro: Record<string, unknown> = {
  Behavior,
  getEnv,
  ENV_TYPE: envType,
  Link,
  interceptors,
  Current,
  getCurrentInstance,
  options,
  nextTick,
  eventCenter,
  Events,
  getInitPxTransform,
  interceptorify,
};

Taro.initPxTransform = getInitPxTransform(Taro);
Taro.preload = getPreload(Current);
Taro.pxTransform = getPxTransform(Taro);

export default Taro;
