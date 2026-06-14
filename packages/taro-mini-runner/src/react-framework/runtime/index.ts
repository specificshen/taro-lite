import { hooks } from '@spcsn/taro-shared';
import * as taroHooks from './hooks';

hooks.tap('initNativeApi', function (taro: Record<string, any>) {
  for (const hook in taroHooks) {
    taro[hook] = (taroHooks as Record<string, any>)[hook];
  }
});

export * from './connect';
export * from './connect-native';
export * from './hooks';
