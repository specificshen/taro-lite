// @ts-nocheck
import { hooks } from '@spcsn/taro-shared';

import * as taroHooks from './hooks';

hooks.tap('initNativeApi', function (taro) {
  for (const hook in taroHooks) {
    taro[hook] = taroHooks[hook];
  }
});

export * from './connect';
export * from './connect-native';
export * from './hooks';
