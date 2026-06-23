/// <reference types="../types" />

import taro from './api';
import { initWeappNativeApiFallback } from './native-api-fallback';
import { initReactHooksFallback } from './react-hooks-fallback';
import { hooks } from './runtime';

type TaroStatic = Taro.TaroStatic;

if (hooks.isExist('initNativeApi')) {
  hooks.call('initNativeApi', taro);
}

initReactHooksFallback(taro);
initWeappNativeApiFallback(taro);

(taro as Record<string, typeof taro>).default = taro;

// 兼容业务代码的 named import
export const useAddToFavorites: TaroStatic['useAddToFavorites'] =
  taro.useAddToFavorites as TaroStatic['useAddToFavorites'];
export const useDidHide: TaroStatic['useDidHide'] = taro.useDidHide as TaroStatic['useDidHide'];
export const useDidShow: TaroStatic['useDidShow'] = taro.useDidShow as TaroStatic['useDidShow'];
export const useError: TaroStatic['useError'] = taro.useError as TaroStatic['useError'];
export const useKeyboardHeight: TaroStatic['useKeyboardHeight'] =
  taro.useKeyboardHeight as TaroStatic['useKeyboardHeight'];
export const useLaunch: TaroStatic['useLaunch'] = taro.useLaunch as TaroStatic['useLaunch'];
export const useLoad: TaroStatic['useLoad'] = taro.useLoad as TaroStatic['useLoad'];
export const useOptionMenuClick: TaroStatic['useOptionMenuClick'] =
  taro.useOptionMenuClick as TaroStatic['useOptionMenuClick'];
export const usePageNotFound: TaroStatic['usePageNotFound'] = taro.usePageNotFound as TaroStatic['usePageNotFound'];
export const usePageScroll: TaroStatic['usePageScroll'] = taro.usePageScroll as TaroStatic['usePageScroll'];
export const usePullDownRefresh: TaroStatic['usePullDownRefresh'] =
  taro.usePullDownRefresh as TaroStatic['usePullDownRefresh'];
export const usePullIntercept: TaroStatic['usePullIntercept'] = taro.usePullIntercept as TaroStatic['usePullIntercept'];
export const useReachBottom: TaroStatic['useReachBottom'] = taro.useReachBottom as TaroStatic['useReachBottom'];
export const useReady: TaroStatic['useReady'] = taro.useReady as TaroStatic['useReady'];
export const useResize: TaroStatic['useResize'] = taro.useResize as TaroStatic['useResize'];
export const useRouter: TaroStatic['useRouter'] = taro.useRouter as TaroStatic['useRouter'];
export const useSaveExitState: TaroStatic['useSaveExitState'] = taro.useSaveExitState as TaroStatic['useSaveExitState'];
export const useScope: TaroStatic['useScope'] = taro.useScope as TaroStatic['useScope'];
export const useShareAppMessage: TaroStatic['useShareAppMessage'] =
  taro.useShareAppMessage as TaroStatic['useShareAppMessage'];
export const useShareTimeline: TaroStatic['useShareTimeline'] = taro.useShareTimeline as TaroStatic['useShareTimeline'];
export const useTabItemTap: TaroStatic['useTabItemTap'] = taro.useTabItemTap as TaroStatic['useTabItemTap'];
export const useTitleClick: TaroStatic['useTitleClick'] = taro.useTitleClick as TaroStatic['useTitleClick'];
export const useUnhandledRejection: TaroStatic['useUnhandledRejection'] =
  taro.useUnhandledRejection as TaroStatic['useUnhandledRejection'];
export const useUnload: TaroStatic['useUnload'] = taro.useUnload as TaroStatic['useUnload'];

export type { default as Chain } from './api/interceptor/chain';
export default taro;
