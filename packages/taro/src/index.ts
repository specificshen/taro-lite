import taro from './api';
import { initWeappNativeApiFallback } from './native-api-fallback';
import { initReactHooksFallback } from './react-hooks-fallback';
import { hooks } from './runtime';

if (hooks.isExist('initNativeApi')) {
  hooks.call('initNativeApi', taro);
}

initReactHooksFallback(taro);
initWeappNativeApiFallback(taro);

(taro as Record<string, typeof taro>).default = taro;
export default taro;
