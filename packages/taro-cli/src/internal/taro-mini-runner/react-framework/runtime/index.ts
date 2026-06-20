import { hooks } from '../../../taro-shared';
import * as taroHooks from './hooks';

hooks.tap('initNativeApi', function (taro: unknown) {
  const api = taro as Record<string, unknown>;
  for (const hook in taroHooks) {
    api[hook] = (taroHooks as Record<string, unknown>)[hook];
  }
});

export * from './connect';
export * from './connect-native';
export * from './hooks';
