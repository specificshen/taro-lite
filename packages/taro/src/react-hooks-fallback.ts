import React from 'react';
import type { Instance } from './runtime';
import { Current, getPageInstance, injectPageInstance } from './runtime';

const hooksMap: Record<string, string> = {
  useAddToFavorites: 'onAddToFavorites',
  useDidHide: 'componentDidHide',
  useDidShow: 'componentDidShow',
  useError: 'onError',
  useKeyboardHeight: 'onKeyboardHeight',
  useLaunch: 'onLaunch',
  useLoad: 'onLoad',
  useOptionMenuClick: 'onOptionMenuClick',
  usePageNotFound: 'onPageNotFound',
  usePageScroll: 'onPageScroll',
  usePullDownRefresh: 'onPullDownRefresh',
  usePullIntercept: 'onPullIntercept',
  useReachBottom: 'onReachBottom',
  useReady: 'onReady',
  useResize: 'onResize',
  useSaveExitState: 'onSaveExitState',
  useShareAppMessage: 'onShareAppMessage',
  useShareTimeline: 'onShareTimeline',
  useTabItemTap: 'onTabItemTap',
  useTitleClick: 'onTitleClick',
  useUnhandledRejection: 'onUnhandledRejection',
  useUnload: 'onUnload',
};

function createHook(lifecycle: string) {
  return (fn: (...args: unknown[]) => void) => {
    const router = Current.router;
    const id = router?.$taroPath || router?.path || 'taro-app';
    const instRef = React.useRef<Instance | undefined>(undefined);
    const fnRef = React.useRef(fn);
    if (fnRef.current !== fn) fnRef.current = fn;

    React.useLayoutEffect(() => {
      instRef.current = getPageInstance(id);
      let inst = instRef.current;
      if (!inst) {
        instRef.current = Object.create(null) as Instance;
        inst = instRef.current;
        injectPageInstance(inst, id);
      }

      const callback = (...args: unknown[]) => fnRef.current(...args);
      if (typeof inst[lifecycle] === 'function') {
        inst[lifecycle] = [inst[lifecycle], callback];
      } else {
        inst[lifecycle] = [...((inst[lifecycle] as unknown[]) || []), callback];
      }

      return () => {
        const inst = instRef.current;
        if (!inst) return;

        const list = inst[lifecycle];
        if (list === callback) {
          inst[lifecycle] = undefined;
        } else if (Array.isArray(list)) {
          inst[lifecycle] = list.filter((item: unknown) => item !== callback);
        }
        instRef.current = undefined;
      };
    }, []);
  };
}

function initReactHooksFallback(taro: Record<string, unknown>): void {
  if (typeof taro.useShareAppMessage === 'function') return;

  Object.keys(hooksMap).forEach((key) => {
    taro[key] = createHook(hooksMap[key]);
  });

  taro.useRouter = function useRouter(dynamic = false) {
    if (dynamic) return Current.router;
    return React.useMemo(() => Current.router, []);
  };

  taro.useScope = function useScope() {
    return undefined;
  };
}

export { initReactHooksFallback };
