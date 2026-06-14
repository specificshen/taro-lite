import { hooks } from '@spcsn/taro-runtime';
import taro from './api';
import { initReactHooksFallback } from './react-hooks-fallback';
import { initWeappNativeApiFallback } from './native-api-fallback';

if (hooks.isExist('initNativeApi')) {
  hooks.call('initNativeApi', taro);
}

initReactHooksFallback(taro);
initWeappNativeApiFallback(taro);

(taro as any).default = taro;
export default taro;
