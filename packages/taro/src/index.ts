import { hooks } from '@spcsn/taro-runtime';
import taro from './api';
import { initWeappNativeApiFallback } from './native-api-fallback';
import { initReactHooksFallback } from './react-hooks-fallback';

if (hooks.isExist('initNativeApi')) {
  hooks.call('initNativeApi', taro);
}

initReactHooksFallback(taro);
initWeappNativeApiFallback(taro);

(taro as any).default = taro;
export default taro;
